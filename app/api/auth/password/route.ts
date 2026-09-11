import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { requireTeacherApi } from '@/lib/auth/api'
import { issueSession } from '@/lib/auth/session'
import { passwordError } from '@/lib/auth/validate'
import { supabase } from '@/lib/supabase'

const BCRYPT_ROUNDS = 12

/**
 * 비밀번호 변경.
 *
 * 현재 비밀번호를 다시 확인하는 이유: 쿠키만 탈취한 공격자가 비밀번호를
 * 바꿔서 계정을 완전히 빼앗는 것을 막는다.
 *
 * 변경 후에는 그 선생님의 모든 refreshToken 을 폐기한다 —
 * 비밀번호를 바꾸는 이유가 보통 "누가 들어온 것 같다" 이므로
 * 다른 기기·다른 브라우저의 세션도 같이 끊어야 의미가 있다.
 * 그리고 바로 새 세션을 발급해 본인은 로그아웃되지 않게 한다.
 */
export async function POST(req: Request) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const { current_password: currentPassword, new_password: newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: '현재 비밀번호와 새 비밀번호를 입력하세요' }, { status: 400 })
  }

  const pwError = passwordError(newPassword)
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: '현재 비밀번호와 다른 비밀번호를 입력하세요' }, { status: 400 })
  }

  const { data: row } = await supabase
    .from('teachers')
    .select('password_hash')
    .eq('id', teacher.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!row?.password_hash) {
    return NextResponse.json({ error: '계정을 찾을 수 없습니다' }, { status: 404 })
  }

  if (!(await bcrypt.compare(currentPassword, row.password_hash))) {
    return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다' }, { status: 401 })
  }

  const { error } = await supabase
    .from('teachers')
    .update({ password_hash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS), updated_by: teacher.id })
    .eq('id', teacher.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 다른 기기 세션 전부 폐기 후, 본인 세션만 새로 발급
  await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('teacher_id', teacher.id)
    .is('revoked_at', null)

  await issueSession(teacher)

  return NextResponse.json({ ok: true })
}
