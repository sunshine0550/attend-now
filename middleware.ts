import { NextResponse, type NextRequest } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE, verifyAccessToken } from '@/lib/auth/tokens'

/**
 * 선생님 전용 경로를 지킨다.
 *
 * 미들웨어는 Edge 에서 돌아 DB 를 쓰기 어렵고 쿠키 재설정도 여기가 가장 편하다.
 * 그래서 역할을 나눴다:
 *   - 미들웨어: accessToken JWT 검증만 (DB 조회 없음)
 *   - /api/auth/refresh: 만료됐을 때 DB 로 refreshToken 회전 후 원래 경로로 복귀
 *
 * 학생 경로(/attend, /done)와 출석 제출은 로그인 없이 열어둬야 한다 —
 * 학생에게 계정을 요구하면 QR 출석이라는 제품 자체가 성립하지 않는다.
 */

/** 로그인 없이 접근 가능한 경로 */
const PUBLIC_PATHS = ['/login', '/signup', '/attend', '/done', '/api/auth']

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true
  // 학생 출석 제출(POST)만 공개. 같은 경로의 GET(출석부 조회)은 선생님용이라 보호한다.
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  // /api/attendance 는 POST(학생 출석)만 공개, GET(출석부)은 보호
  if (pathname === '/api/attendance' && req.method === 'POST') return NextResponse.next()

  const access = req.cookies.get(ACCESS_COOKIE)?.value
  if (access && (await verifyAccessToken(access))) return NextResponse.next()

  // accessToken 이 없거나 만료됨. refreshToken 이 있으면 회전을 시도한다.
  if (req.cookies.get(REFRESH_COOKIE)) {
    const url = req.nextUrl.clone()
    url.pathname = '/api/auth/refresh'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  // API 는 리다이렉트 대신 401 을 준다 (fetch 하는 쪽이 HTML 을 받으면 파싱이 깨진다)
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const login = req.nextUrl.clone()
  login.pathname = '/login'
  login.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(login)
}

export const config = {
  // 정적 파일과 이미지 최적화 경로는 제외
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
