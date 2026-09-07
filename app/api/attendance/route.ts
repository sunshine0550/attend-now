import { NextResponse } from 'next/server'
import { getLecture, getLectureAttendance } from '@/lib/queries'
import { supabase, TEACHER_ID } from '@/lib/supabase'
import { todayKST } from '@/lib/utils'

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const lectureId = params.get('lecture_id')
  const month = params.get('month') ?? todayKST().slice(0, 7)

  if (!lectureId) return NextResponse.json({ error: 'lecture_id 가 필요합니다' }, { status: 400 })

  try {
    return NextResponse.json(await getLectureAttendance(lectureId, month))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { student_phone, student_name, student_english_name, lecture_id } = await req.json()

  if (!student_phone || !student_name || !student_english_name || !lecture_id) {
    return NextResponse.json({ error: '이름, 영어 이름, 전화번호를 모두 입력하세요' }, { status: 400 })
  }
  if (!/^010-\d{4}-\d{4}$/.test(student_phone)) {
    return NextResponse.json({ error: '전화번호는 010-0000-0000 형식으로 입력하세요' }, { status: 400 })
  }

  const lecture = await getLecture(lecture_id)
  if (!lecture) return NextResponse.json({ error: '강의를 찾을 수 없습니다' }, { status: 404 })

  // 학생 관리 목록이 자동으로 채워지도록 처음 출석하는 학생은 students에 등록
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('phone', student_phone)
    .maybeSingle()

  if (!existing) {
    await supabase.from('students').insert({
      name: student_name,
      english_name: student_english_name,
      phone: student_phone,
      created_by: TEACHER_ID,
      updated_by: TEACHER_ID,
    })
  }

  const { data, error } = await supabase
    .from('attendance_log')
    .insert({
      student_phone,
      student_name,
      student_english_name,
      lecture_id,
      lecture_name: lecture.lecture_name,
      attended_at: new Date().toISOString(),
      date: todayKST(),
      created_by: TEACHER_ID,
      updated_by: TEACHER_ID,
    })
    .select()
    .single()

  // UNIQUE(student_phone, lecture_id, date) 위반 = 오늘 이미 출석
  if (error?.code === '23505') return NextResponse.json({ already: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

/** 소프트 딜리트 — deleted_by 는 서버의 TEACHER_ID 를 쓴다 (클라이언트가 위조할 수 없게) */
export async function DELETE(req: Request) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id 가 필요합니다' }, { status: 400 })

  const { data, error } = await supabase
    .from('attendance_log')
    .update({ deleted_at: new Date().toISOString(), deleted_by: TEACHER_ID })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '출석 기록을 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
