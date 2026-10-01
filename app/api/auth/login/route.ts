import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { checkLoginAttempts, clearLoginAttempts, recordFailedLogin } from '@/lib/auth/rate-limit'
import { issueSession, type Teacher } from '@/lib/auth/session'
import { normalizeLoginId } from '@/lib/auth/validate'
import { supabase } from '@/lib/supabase'

/**
 * 존재하지 않는 아이디와 비밀번호 오류를 같은 메시지·비슷한 시간으로 응답한다.
 * 메시지가 다르면 "이 아이디는 가입되어 있다"는 정보가 새고,
 * 응답 시간이 다르면 그것으로도 구분할 수 있다(timing attack).
 */
const SAME_ERROR = '아이디 또는 비밀번호가 올바르지 않습니다'

/**
 * DB 를 읽지 못해 "판정 자체를 못 한" 경우.
 *
 * 예전에는 이 상황이 401 SAME_ERROR 로 나가서 사용자가 멀쩡한 비밀번호를
 * 의심했다. 비밀번호 문제가 아니라는 점과 문의 경로를 분명히 말해준다.
 */
const DB_ERROR =
  '데이터베이스에 연결할 수 없어 로그인을 확인하지 못했습니다. 아이디·비밀번호 문제가 아닙니다. 잠시 후 다시 시도하고, 계속되면 개발자에게 문의해 주세요'

/** 예상 못 한 예외의 원인은 로그에만 남기고 사용자에게는 고정 문구를 준다 */
const UNKNOWN_ERROR = '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요'

/**
 * 아이디가 없을 때도 같은 시간을 쓰도록 비교하는 유효한 bcrypt 해시.
 * 임의 값으로 만들었으므로 어떤 비밀번호와도 일치하지 않는다.
 * 형식이 잘못되면 bcrypt 가 0ms 에 반환해 방어가 무의미해지므로 실제 해시여야 한다.
 */
const DUMMY_HASH = '$2b$12$.KWXojrChrnQAoIpdsUsBumrl645HHzGYRlS8JU5JuPx8g/Z5ylBW'

function dbUnavailable() {
  return NextResponse.json({ error: DB_ERROR, code: 'db_unavailable' }, { status: 503 })
}

/** fetch 레벨 실패는 Supabase 오리진이 죽었을 때 나온다(일시정지·재시작·Cloudflare 521) */
function looksLikeNetworkFailure(message: string) {
  return /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|521|socket hang up/i.test(message)
}

export async function POST(req: Request) {
  try {
    return await handleLogin(req)
  } catch (e) {
    // 예외가 그대로 나가면 Next 가 JSON 아닌 500 을 반환해서
    // 클라이언트가 "서버에 연결할 수 없습니다" 만 보여주고 원인을 알 수 없다.
    console.error('[auth/login]', e)

    // AUTH_SECRET 미설정 안내는 설정 방법을 알려주는 유용한 메시지이고
    // 비밀 값을 담지 않는다. 이것만 예외적으로 본문에 노출한다.
    const message = (e as Error).message ?? ''
    if (message.includes('AUTH_SECRET')) {
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ error: UNKNOWN_ERROR }, { status: 500 })
  }
}

async function handleLogin(req: Request) {
  const body = await req.json()
  const loginId = normalizeLoginId(String(body.login_id ?? ''))
  const password = String(body.password ?? '')

  if (!loginId || !password) {
    return NextResponse.json({ error: SAME_ERROR }, { status: 401 })
  }

  const limit = await checkLoginAttempts(loginId)
  if (limit.status === 'blocked') {
    return NextResponse.json(
      { error: `로그인 시도가 너무 많습니다. ${limit.retryAfterMin}분 후 다시 시도하세요` },
      { status: 429 },
    )
  }
  // 횟수를 세지 못했으면 잠긴 계정인지 알 수 없다. 429 로 오해시키지 않는다.
  if (limit.status === 'unavailable') return dbUnavailable()

  const { data: teacher, error: lookupError } = await supabase
    .from('teachers')
    .select('id, name, login_id, password_hash')
    .eq('login_id', loginId)
    .is('deleted_at', null)
    .maybeSingle()

  if (lookupError) {
    console.error('[auth/login] teachers 조회 실패', lookupError.code, lookupError.message)
    if (looksLikeNetworkFailure(lookupError.message)) {
      console.error(
        '[auth/login] Supabase 오리진에 닿지 못했습니다. 프로젝트가 일시정지·재시작 중일 수 있으니 Supabase 대시보드에서 상태를 확인하세요.',
      )
    }

    // 여기서 바로 반환하는 이유:
    //  - bcrypt.compare 이전이어야 "없는 아이디"로 흘러가 401 이 되지 않는다
    //  - recordFailedLogin 을 건너뛰어야 한다. 판정조차 못 했는데 실패로 세면
    //    DB 가 복구된 뒤 정상 사용자가 429 로 잠긴다
    // 더미 해시 타이밍 방어는 "아이디 존재 여부"를 가리는 장치라 인프라 장애에는 불필요하다.
    // lookupError.message 는 호스트명·스키마가 섞일 수 있어 본문에 넣지 않는다.
    return dbUnavailable()
  }

  const ok = await bcrypt.compare(password, teacher?.password_hash ?? DUMMY_HASH)

  if (!teacher || !teacher.password_hash || !ok) {
    await recordFailedLogin(loginId)
    return NextResponse.json({ error: SAME_ERROR }, { status: 401 })
  }

  await clearLoginAttempts(loginId)
  await supabase.from('teachers').update({ last_login_at: new Date().toISOString() }).eq('id', teacher.id)

  // password_hash 는 응답에 절대 포함하지 않는다
  const safe: Teacher = { id: teacher.id, name: teacher.name, login_id: teacher.login_id }
  await issueSession(safe)

  return NextResponse.json({ teacher: safe })
}
