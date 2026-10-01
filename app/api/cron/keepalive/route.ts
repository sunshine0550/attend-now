import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Supabase keep-alive.
 *
 * Free 플랜은 7일간 활동이 없으면 프로젝트를 자동 일시정지한다. 일시정지되면
 * REST 오리진이 죽어 로그인부터 전부 실패하므로, 하루 한 번 가벼운 쿼리로
 * "활동"을 만들어 둔다.
 *
 * /auth/v1/health 같은 엔드포인트는 Postgres 를 건드리지 않아 활동으로
 * 집계되지 않는다. 그래서 반드시 테이블을 읽는 쿼리를 쓴다.
 */

// Vercel cron 이 캐시된 응답을 받으면 DB 를 전혀 건드리지 않아 의미가 없다
export const dynamic = 'force-dynamic'

/**
 * 길이를 먼저 확인한 뒤 바이트 XOR 을 누적해 비교한다.
 * === 는 첫 불일치에서 즉시 끝나 비교 시간으로 토큰을 한 글자씩 맞출 수 있다.
 */
function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET

  // 이 경로는 인터넷에 공개돼 있다. 시크릿이 없으면 무인증 공개가 되므로
  // 통과시키지 않고 막는다 (설정 누락이 곧 취약점이 되지 않게).
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET 이 설정되지 않았습니다' }, { status: 503 })
  }

  const auth = req.headers.get('Authorization') ?? ''
  if (!safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: '인증되지 않은 요청입니다' }, { status: 401 })
  }

  const started = Date.now()
  // head: true 라서 행 본문은 받지 않는다. Postgres 를 건드리는 게 목적.
  const { count, error } = await supabase.from('teachers').select('id', { count: 'exact', head: true })
  const ms = Date.now() - started

  if (error) {
    // 원인은 서버 로그에만. 응답 본문에 DB 오류 메시지나 접속 정보를 넣지 않는다.
    console.error('[cron/keepalive]', error.code, error.message)
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  return NextResponse.json({ ok: true, count, ms })
}
