import 'server-only'

import { SignJWT, jwtVerify } from 'jose'

/**
 * 토큰 설계
 *
 * accessToken  — JWT. 짧게(1시간) 살고 DB 조회 없이 미들웨어에서 검증한다.
 *                요청마다 DB를 때리지 않으려는 목적.
 * refreshToken — 임의의 32바이트. JWT가 아니라 불투명(opaque) 문자열이다.
 *                DB에는 원문이 아니라 SHA-256 해시만 저장한다. DB가 유출돼도
 *                그 값으로 로그인할 수 없다.
 *
 * 만료를 refreshToken 쪽에만 두고(3일), 쓸 때마다 3일을 다시 채운다(sliding).
 * 그래서 "3일 동안 사용이 없으면 로그아웃"이 된다.
 */

export const ACCESS_TTL_SEC = 60 * 60 // 1시간
export const REFRESH_TTL_SEC = 60 * 60 * 24 * 3 // 3일 (미사용 기준)

export const ACCESS_COOKIE = 'at'
export const REFRESH_COOKIE = 'rt'

function secret() {
  const raw = process.env.AUTH_SECRET
  if (!raw || raw.length < 32) {
    throw new Error(
      'AUTH_SECRET 환경변수가 없거나 32자보다 짧습니다. ' +
        '로컬은 .env.local, 배포는 Vercel → Settings → Environment Variables 에 설정한 뒤 재배포하세요.',
    )
  }
  return new TextEncoder().encode(raw)
}

export type AccessClaims = { teacherId: string; name: string }

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ name: claims.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.teacherId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secret())
}

/** 검증 실패(만료·위조)는 예외가 아니라 null 로 돌려준다 */
export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    if (!payload.sub) return null
    return { teacherId: payload.sub, name: String(payload.name ?? '') }
  } catch {
    return null
  }
}

/** 새 refreshToken 원문. 이 값은 쿠키로만 나가고 DB 에는 해시가 들어간다 */
export function createRefreshToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function hashRefreshToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
