import { NextResponse } from 'next/server'
import { getStudents } from '@/lib/queries'
import { supabase, TEACHER_ID } from '@/lib/supabase'

export async function GET() {
  try {
    return NextResponse.json(await getStudents())
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { name, english_name, phone } = await req.json()

  if (!name || !english_name || !phone) {
    return NextResponse.json({ error: '이름, 영어 이름, 전화번호를 모두 입력하세요' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('students')
    .insert({ name, english_name, phone, created_by: TEACHER_ID, updated_by: TEACHER_ID })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
