import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ACCESS_COOKIE,
  ACCESS_TTL_SEC,
  REFRESH_COOKIE,
  REFRESH_TTL_SEC,
  createRefreshToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from './tokens'

export type Teacher = { id: string; name: string; phone: string }

const isProd = process.env.NODE_ENV === 'production'

/** 두 쿠키 모두 httpOnly — 자바스크립트로 읽을 수 없어 XSS 로 탈취되지 않는다 */
function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

/**
 * 로그인/토큰 갱신 성공 시 호출. accessToken 과 새 refreshToken 을 함께 내려준다.
 * refreshToken 은 매번 새로 발급(회전)하고 DB 에는 해시만 남긴다.
 */
export async function issueSession(teacher: Teacher) {
  const jar = await cookies()

  const refresh = createRefreshToken()
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000)

  const { error } = await supabase.from('refresh_tokens').insert({
    teacher_id: teacher.id,
    token_hash: await hashRefreshToken(refresh),
    expires_at: expiresAt.toISOString(),
  })
  if (error) throw new Error(error.message)

  jar.set(ACCESS_COOKIE, await signAccessToken({ teacherId: teacher.id, name: teacher.name }), cookieOptions(ACCESS_TTL_SEC))
  jar.set(REFRESH_COOKIE, refresh, cookieOptions(REFRESH_TTL_SEC))
}

/**
 * refreshToken 을 검증하고 회전한다.
 *
 * 이미 사용된 토큰이 다시 들어오면 세션이 탈취된 것으로 보고 그 선생님의
 * 모든 토큰을 폐기한다(reuse detection). 정상 사용자는 회전된 최신 토큰만
 * 갖고 있으므로 과거 토큰이 다시 올 이유가 없다.
 */
export async function rotateSession(): Promise<Teacher | null> {
  const jar = await cookies()
  const presented = jar.get(REFRESH_COOKIE)?.value
  if (!presented) return null

  const { data: row } = await supabase
    .from('refresh_tokens')
    .select('id, teacher_id, expires_at, used_at, revoked_at')
    .eq('token_hash', await hashRefreshToken(presented))
    .maybeSingle()

  if (!row) return null

  if (row.used_at || row.revoked_at) {
    // 재사용 감지 — 해당 선생님의 살아있는 토큰을 전부 폐기한다
    await supabase
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('teacher_id', row.teacher_id)
      .is('revoked_at', null)
    return null
  }

  if (new Date(row.expires_at) < new Date()) return null

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, name, phone')
    .eq('id', row.teacher_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!teacher) return null

  // 사용 표시 후 새 쌍 발급 → 만료가 다시 3일 뒤로 밀린다
  await supabase.from('refresh_tokens').update({ used_at: new Date().toISOString() }).eq('id', row.id)
  await issueSession(teacher as Teacher)

  return teacher as Teacher
}

/** 쿠키를 지우고 그 refreshToken 을 폐기한다 */
export async function clearSession() {
  const jar = await cookies()
  const presented = jar.get(REFRESH_COOKIE)?.value

  if (presented) {
    await supabase
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', await hashRefreshToken(presented))
      .is('revoked_at', null)
  }

  jar.delete(ACCESS_COOKIE)
  jar.delete(REFRESH_COOKIE)
}

/**
 * 서버 컴포넌트/라우트에서 현재 선생님을 얻는다.
 *
 * accessToken 만 검증한다 — 서버 컴포넌트에서는 쿠키를 새로 설정할 수 없어
 * 여기서 회전을 할 수 없다. 만료된 경우 미들웨어가 /api/auth/refresh 로
 * 보내 회전시킨 뒤 원래 경로로 되돌린다.
 */
export async function getTeacher(): Promise<Teacher | null> {
  const jar = await cookies()
  const token = jar.get(ACCESS_COOKIE)?.value
  if (!token) return null

  const claims = await verifyAccessToken(token)
  if (!claims) return null

  const { data } = await supabase
    .from('teachers')
    .select('id, name, phone')
    .eq('id', claims.teacherId)
    .is('deleted_at', null)
    .maybeSingle()

  return (data as Teacher | null) ?? null
}

/** 선생님 전용 페이지에서 사용. 세션이 없으면 로그인으로 보낸다 */
export async function requireTeacher(): Promise<Teacher> {
  const teacher = await getTeacher()
  if (!teacher) redirect('/login')
  return teacher
}
