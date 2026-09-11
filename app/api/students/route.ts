import { NextResponse } from 'next/server'
import { requireTeacherApi } from '@/lib/auth/api'
import { getStudents } from '@/lib/queries'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const params = new URL(req.url).searchParams

  try {
    return NextResponse.json(
      await getStudents(teacher.id, {
        q: params.get('q') ?? undefined,
        cursor: params.get('cursor') ?? undefined,
        limit: Number(params.get('limit')) || 10,
      }),
    )
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const { name, english_name, phone } = await req.json()

  if (!name || !english_name || !phone) {
    return NextResponse.json({ error: '이름, 영어 이름, 전화번호를 모두 입력하세요' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('students')
    .insert({ name, english_name, phone, created_by: teacher.id, updated_by: teacher.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
