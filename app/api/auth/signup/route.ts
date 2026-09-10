import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { issueSession, type Teacher } from '@/lib/auth/session'
import { supabase } from '@/lib/supabase'

/** bcrypt 라운드. 12 는 온라인 로그인에서 널리 쓰이는 값(해싱 ~250ms) */
const BCRYPT_ROUNDS = 12

export async function POST(req: Request) {
  const { name, phone, password, invite } = await req.json()

  if (!name?.trim() || !phone || !password) {
    return NextResponse.json({ error: '이름, 전화번호, 비밀번호를 모두 입력하세요' }, { status: 400 })
  }
  if (!/^010-\d{4}-\d{4}$/.test(phone)) {
    return NextResponse.json({ error: '전화번호는 010-0000-0000 형식으로 입력하세요' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다' }, { status: 400 })
  }

  const expected = process.env.SIGNUP_INVITE_CODE
  if (!expected) {
    return NextResponse.json({ error: '서버에 초대 코드가 설정되지 않았습니다' }, { status: 500 })
  }
  if (invite !== expected) {
    return NextResponse.json({ error: '초대 코드가 올바르지 않습니다' }, { status: 403 })
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  // 전화번호가 UNIQUE 이므로 기존 row 를 먼저 확인한다.
  // 비밀번호가 없는 계정(= 로그인 도입 전에 만들어진 계정)은 같은 번호로
  // 가입하면 그 계정을 이어받는다. 한 번 설정되면 다시 인수할 수 없다.
  const { data: existing } = await supabase
    .from('teachers')
    .select('id, name, phone, password_hash')
    .eq('phone', phone)
    .maybeSingle()

  if (existing) {
    if (existing.password_hash) {
      return NextResponse.json({ error: '이미 가입된 전화번호입니다' }, { status: 409 })
    }

    const { data: claimed, error } = await supabase
      .from('teachers')
      .update({ name: name.trim(), password_hash: passwordHash, updated_by: existing.id })
      .eq('id', existing.id)
      .is('password_hash', null) // 동시 요청이 겹쳐도 한쪽만 성공한다
      .select('id, name, phone')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!claimed) return NextResponse.json({ error: '이미 가입된 전화번호입니다' }, { status: 409 })

    await issueSession(claimed as Teacher)
    return NextResponse.json({ teacher: claimed, claimed: true }, { status: 200 })
  }

  const { data: created, error } = await supabase
    .from('teachers')
    .insert({ name: name.trim(), phone, password_hash: passwordHash })
    .select('id, name, phone')
    .single()

  if (error?.code === '23505') {
    return NextResponse.json({ error: '이미 가입된 전화번호입니다' }, { status: 409 })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 자기 자신을 만든 사람으로 기록 (audit 컬럼이 teachers 를 참조한다)
  await supabase.from('teachers').update({ created_by: created.id, updated_by: created.id }).eq('id', created.id)

  await issueSession(created as Teacher)
  return NextResponse.json({ teacher: created }, { status: 201 })
}
