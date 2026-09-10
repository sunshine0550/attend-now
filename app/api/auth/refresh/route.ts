import { NextResponse } from 'next/server'
import { clearSession, rotateSession } from '@/lib/auth/session'

/**
 * 미들웨어가 accessToken 만료를 감지하면 여기로 보낸다.
 * refreshToken 을 회전해 새 쿠키를 심고 원래 경로로 되돌린다.
 *
 * 서버 컴포넌트에서는 쿠키를 설정할 수 없어 이 우회가 필요하다.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const raw = url.searchParams.get('next') ?? '/'
  // 외부 도메인으로 보내는 오픈 리다이렉트를 막는다
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'

  const teacher = await rotateSession()

  if (!teacher) {
    await clearSession()
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url.origin))
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
