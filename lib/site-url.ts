/**
 * QR 코드에 박을 사이트 주소.
 *
 * 브라우저의 window.location.origin 을 쓰면 로컬에서는 localhost 가 박혀서
 * 휴대폰이 접속할 수 없고, Vercel 프리뷰 배포에서는 배포마다 바뀌는 주소가 박힌다.
 * 그래서 서버에서 고정 주소를 정해 내려준다.
 *
 * 우선순위:
 *  1. SITE_URL          — 직접 지정 (커스텀 도메인을 붙였을 때)
 *  2. VERCEL_PROJECT_PRODUCTION_URL — Vercel이 넣어주는 "운영" 도메인 (배포마다 바뀌지 않음)
 *  3. null              — 로컬 개발. 클라이언트가 현재 origin 을 쓴다
 */
export function siteUrl(): string | null {
  const explicit = process.env.SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (production) return `https://${production}`

  return null
}

/** 학생 출석 페이지 주소. 로컬에서는 null 이고, 그때는 클라이언트가 현재 origin 을 붙인다 */
export function attendUrl(lectureId: string): string | null {
  const base = siteUrl()
  return base ? `${base}/attend/${lectureId}` : null
}
