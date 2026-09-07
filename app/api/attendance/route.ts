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
    const { rows } = await getLectureAttendance(lectureId, month)
    return NextResponse.json(rows)
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

  // 전화번호로 학생을 식별한다. 같은 번호면 기존 row와 그 UUID를 재사용한다.
  // (phone 이 UNIQUE 이므로 deleted_at 필터 없이 조회해야 삭제된 학생도 찾는다)
  const { data: existing, error: lookupError } = await supabase
    .from('students')
    .select('id, name, english_name, deleted_at')
    .eq('phone', student_phone)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })

  let studentId: string

  if (!existing) {
    const { data: created, error: insertError } = await supabase
      .from('students')
      .insert({
        name: student_name,
        english_name: student_english_name,
        phone: student_phone,
        created_by: TEACHER_ID,
        updated_by: TEACHER_ID,
      })
      .select('id')
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    studentId = created.id
  } else {
    studentId = existing.id

    if (
      existing.deleted_at ||
      existing.name !== student_name ||
      existing.english_name !== student_english_name
    ) {
      // 이름이 바뀌었으면 최신 입력으로 갱신하고,
      // 삭제됐던 학생이 다시 출석하면 되살린다 (안 그러면 목록에 안 보이는데 출석만 쌓인다)
      await supabase
        .from('students')
        .update({
          name: student_name,
          english_name: student_english_name,
          deleted_at: null,
          deleted_by: null,
          updated_by: TEACHER_ID,
        })
        .eq('id', studentId)
    }
  }

  const { data, error } = await supabase
    .from('attendance_log')
    .insert({
      student_id: studentId,
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

  // UNIQUE(student_id, lecture_id, date) 위반 = 오늘 이미 출석
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
