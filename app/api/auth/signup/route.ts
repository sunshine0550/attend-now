import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { issueSession, type Teacher } from '@/lib/auth/session'
import { loginIdError, normalizeLoginId, passwordError } from '@/lib/auth/validate'
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

  const expected = process.env.SIGNUP_INVITE_CODE
  if (!expected) {
    return NextResponse.json({ error: '서버에 초대 코드가 설정되지 않았습니다' }, { status: 500 })
  }
  if (body.invite !== expected) {
    return NextResponse.json({ error: '초대 코드가 올바르지 않습니다' }, { status: 403 })
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const { data: created, error } = await supabase
    .from('teachers')
    .insert({ name, login_id: loginId, password_hash: passwordHash })
    .select('id, name, login_id')
    .single()

  // login_id UNIQUE 위반
  if (error?.code === '23505') {
    return NextResponse.json({ error: '이미 사용 중인 아이디입니다' }, { status: 409 })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 자기 자신을 만든 사람으로 기록 (audit 컬럼이 teachers 를 참조한다)
  await supabase.from('teachers').update({ created_by: created.id, updated_by: created.id }).eq('id', created.id)

  await issueSession(created as Teacher)
  return NextResponse.json({ teacher: created }, { status: 201 })
}
