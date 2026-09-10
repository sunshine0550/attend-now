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

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMin: number }

export async function checkLoginAttempts(loginId: string): Promise<RateLimitResult> {
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString()

  const { count } = await supabase
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('login_id', loginId)
    .gte('attempted_at', since)

  if ((count ?? 0) >= MAX_ATTEMPTS) return { allowed: false, retryAfterMin: WINDOW_MIN }
  return { allowed: true }
}

export async function recordFailedLogin(loginId: string) {
  await supabase.from('login_attempts').insert({ login_id: loginId })
}

/** 로그인 성공 시 그 아이디의 실패 기록을 지운다 */
export async function clearLoginAttempts(loginId: string) {
  await supabase.from('login_attempts').delete().eq('login_id', loginId)
}
