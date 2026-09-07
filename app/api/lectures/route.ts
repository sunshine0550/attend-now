import { NextResponse } from 'next/server'
import { getLectures } from '@/lib/queries'
import { supabase, TEACHER_ID } from '@/lib/supabase'
import { todayKST } from '@/lib/utils'

export async function GET(req: Request) {
  const month = new URL(req.url).searchParams.get('month') ?? todayKST().slice(0, 7)

  try {
    return NextResponse.json(await getLectures(month))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const { lecture_name, days, start_date, end_date } = body

  if (!lecture_name || !days || !start_date || !end_date) {
    return NextResponse.json({ error: '강의 이름, 요일, 시작일, 종료일을 모두 입력하세요' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('lectures')
    .insert({
      teacher_id: TEACHER_ID,
      lecture_name,
      days,
      start_date,
      end_date,
      created_by: TEACHER_ID,
      updated_by: TEACHER_ID,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
