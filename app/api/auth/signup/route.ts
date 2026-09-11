import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { issueSession, type Teacher } from '@/lib/auth/session'
import { loginIdError, normalizeLoginId, passwordError } from '@/lib/auth/validate'
import { claimInvite, markInviteUsedBy, releaseInvite } from '@/lib/invites'
import { supabase } from '@/lib/supabase'

/** bcrypt 라운드. 12 는 온라인 로그인에서 널리 쓰이는 값(해싱 ~250ms) */
const BCRYPT_ROUNDS = 12

export async function POST(req: Request) {
  const body = await req.json()
  const name = String(body.name ?? '').trim()
  const loginId = normalizeLoginId(String(body.login_id ?? ''))
  const password = String(body.password ?? '')

  if (!name) return NextResponse.json({ error: '이름을 입력하세요' }, { status: 400 })

  const idError = loginIdError(loginId)
  if (idError) return NextResponse.json({ error: idError }, { status: 400 })

  const pwError = passwordError(password)
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

  const invite = String(body.invite ?? '')

  // 코드를 먼저 소진한다 — 계정을 만든 뒤에 확인하면 두 사람이 같은 코드로
  // 동시에 가입할 수 있다. 계정 생성이 실패하면 아래에서 되돌린다.
  const claim = await claimInvite(invite)
  if (!claim.ok) return NextResponse.json({ error: claim.error }, { status: 403 })

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const { data: created, error } = await supabase
    .from('teachers')
    .insert({ name, login_id: loginId, password_hash: passwordHash })
    .select('id, name, login_id')
    .single()

  if (error) {
    await releaseInvite(invite) // 코드를 다시 쓸 수 있게 되돌린다
    // login_id UNIQUE 위반
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 사용 중인 아이디입니다' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await markInviteUsedBy(invite, created.id)

  // 자기 자신을 만든 사람으로 기록 (audit 컬럼이 teachers 를 참조한다)
  await supabase.from('teachers').update({ created_by: created.id, updated_by: created.id }).eq('id', created.id)

  await issueSession(created as Teacher)
  return NextResponse.json({ teacher: created }, { status: 201 })
}
