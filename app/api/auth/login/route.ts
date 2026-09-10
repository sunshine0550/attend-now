import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { checkLoginAttempts, clearLoginAttempts, recordFailedLogin } from '@/lib/auth/rate-limit'
import { issueSession, type Teacher } from '@/lib/auth/session'
import { supabase } from '@/lib/supabase'

/**
 * 존재하지 않는 번호와 비밀번호 오류를 같은 메시지·비슷한 시간으로 응답한다.
 * 메시지가 다르면 "이 번호는 가입되어 있다"는 정보가 새고,
 * 응답 시간이 다르면 그것으로도 구분할 수 있다(timing attack).
 */
const SAME_ERROR = '전화번호 또는 비밀번호가 올바르지 않습니다'

/**
 * 번호가 없을 때도 같은 시간을 쓰도록 비교하는 유효한 bcrypt 해시.
 * 임의 값으로 만들었으므로 어떤 비밀번호와도 일치하지 않는다.
 * 형식이 잘못되면 bcrypt 가 0ms 에 반환해 방어가 무의미해지므로 실제 해시여야 한다.
 */
const DUMMY_HASH = '$2b$12$.KWXojrChrnQAoIpdsUsBumrl645HHzGYRlS8JU5JuPx8g/Z5ylBW'

export async function POST(req: Request) {
  const { phone, password } = await req.json()

  if (!phone || !password) {
    return NextResponse.json({ error: SAME_ERROR }, { status: 401 })
  }

  const limit = await checkLoginAttempts(phone)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `로그인 시도가 너무 많습니다. ${limit.retryAfterMin}분 후 다시 시도하세요` },
      { status: 429 },
    )
  }

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, name, phone, password_hash')
    .eq('phone', phone)
    .is('deleted_at', null)
    .maybeSingle()

  const ok = await bcrypt.compare(password, teacher?.password_hash ?? DUMMY_HASH)

  if (!teacher || !teacher.password_hash || !ok) {
    await recordFailedLogin(phone)
    return NextResponse.json({ error: SAME_ERROR }, { status: 401 })
  }

  await clearLoginAttempts(phone)

  await supabase.from('teachers').update({ last_login_at: new Date().toISOString() }).eq('id', teacher.id)

  // password_hash 는 응답에 절대 포함하지 않는다
  const safe: Teacher = { id: teacher.id, name: teacher.name, phone: teacher.phone }
  await issueSession(safe)

  return NextResponse.json({ teacher: safe })
}
