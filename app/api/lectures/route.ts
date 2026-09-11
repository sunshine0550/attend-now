import { NextResponse } from 'next/server'
import { requireTeacherApi } from '@/lib/auth/api'
import { getLectures } from '@/lib/queries'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  try {
    return NextResponse.json(await getLectures(teacher.id))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const { lecture_name, days, sessions_per_month, start_time, end_time } = await req.json()

  if (!lecture_name || !days || !sessions_per_month) {
    return NextResponse.json({ error: '강의 이름과 수업 요일을 선택하세요' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('lectures')
    .insert({
      teacher_id: teacher.id,
      lecture_name,
      days,
      sessions_per_month,
      // 시간은 선택 입력 — 빈 문자열이 오면 null 로 저장한다
      start_time: start_time || null,
      end_time: end_time || null,
      created_by: teacher.id,
      updated_by: teacher.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
