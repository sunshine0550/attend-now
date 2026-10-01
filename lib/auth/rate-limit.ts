import 'server-only'

import { supabase } from '@/lib/supabase'

/**
 * 로그인 무차별 시도 제한.
 *
 * bcrypt 비용(약 250ms)만으로도 초당 4회 정도로 느려지지만, 그것만으로는
 * 며칠에 걸친 시도를 막지 못한다. 아이디별로 실패 횟수를 세서 잠근다.
 *
 * 메모리가 아니라 DB에 저장하는 이유: 서버리스는 요청마다 다른 인스턴스에서
 * 실행될 수 있어 메모리 카운터가 공유되지 않는다.
 */

const MAX_ATTEMPTS = 5
const WINDOW_MIN = 15

/**
 * 3-상태 판별 유니온.
 *
 * allowed: boolean 에 필드를 덧붙이면 `if (!limit.allowed)` 가 "DB 장애"까지
 * 429 로 흘려보낸다. 상태를 분리해 컴파일러가 세 분기를 모두 강제하게 한다.
 */
export type RateLimitResult =
  | { status: 'allowed' }
  | { status: 'blocked'; retryAfterMin: number }
  | { status: 'unavailable' }

export async function checkLoginAttempts(loginId: string): Promise<RateLimitResult> {
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString()

  const { count, error } = await supabase
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('login_id', loginId)
    .gte('attempted_at', since)

  // 조회 실패를 count 0 으로 폴백하면 제한이 조용히 풀린다. 모른다고 알린다.
  if (error) {
    console.error('[rate-limit] 시도 횟수 조회 실패', error.code, error.message)
    return { status: 'unavailable' }
  }

  if ((count ?? 0) >= MAX_ATTEMPTS) return { status: 'blocked', retryAfterMin: WINDOW_MIN }
  return { status: 'allowed' }
}

/**
 * 기록 실패는 로그만 남기고 삼킨다.
 *
 * 여기서 throw 하면 정상적인 401 자격증명 오류가 500 으로 바뀌어,
 * 사용자는 "비밀번호가 틀렸다"는 사실조차 알 수 없게 된다.
 */
export async function recordFailedLogin(loginId: string) {
  const { error } = await supabase.from('login_attempts').insert({ login_id: loginId })
  if (error) console.error('[rate-limit] 실패 기록 저장 실패', error.code, error.message)
}

/**
 * 로그인 성공 시 그 아이디의 실패 기록을 지운다.
 * 삭제 실패로 throw 하면 이미 인증된 로그인이 500 이 된다. 로그만 남긴다.
 */
export async function clearLoginAttempts(loginId: string) {
  const { error } = await supabase.from('login_attempts').delete().eq('login_id', loginId)
  if (error) console.error('[rate-limit] 실패 기록 삭제 실패', error.code, error.message)
}
