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

type StudentRow = { id: string; name: string; english_name: string; deleted_at: string | null }

/**
 * 전화번호로 학생을 찾는다.
 * phone 이 UNIQUE 라 한 번호당 row 는 반드시 하나뿐이고,
 * deleted_at 필터를 걸지 않아야 삭제된 학생도 찾아서 그 UUID 를 재사용할 수 있다.
 */
async function findStudentByPhone(phone: string) {
  return supabase.from('students').select('id, name, english_name, deleted_at').eq('phone', phone).maybeSingle()
}

/**
 * 학생이 실제로 왔다는 게 확인됐을 때 호출한다 (신규 출석이든 중복 스캔이든).
 * 이름·영어이름이 달라졌으면 최신 입력으로 갱신하고, 삭제됐던 학생이면 되살린다.
 * 바뀐 게 없으면 쿼리를 보내지 않는다.
 */
async function syncStudent(student: StudentRow, name: string, englishName: string) {
  const stale =
    student.deleted_at !== null || student.name !== name || student.english_name !== englishName
  if (!stale) return

  await supabase
    .from('students')
    .update({
      name,
      english_name: englishName,
      deleted_at: null,
      deleted_by: null,
      updated_by: TEACHER_ID,
    })
    .eq('id', student.id)
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

  const { data: found, error: lookupError } = await findStudentByPhone(student_phone)
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })

  let student = found as StudentRow | null

  if (!student) {
    const { data: created, error: insertError } = await supabase
      .from('students')
      .insert({
        name: student_name,
        english_name: student_english_name,
        phone: student_phone,
        created_by: TEACHER_ID,
        updated_by: TEACHER_ID,
      })
      .select('id, name, english_name, deleted_at')
      .single()

    if (insertError?.code === '23505') {
      // 같은 번호로 거의 동시에 두 번 제출된 경우(버튼 연타 등).
      // phone UNIQUE 가 중복 생성을 막아줬으니 방금 만들어진 row 를 다시 찾아 쓴다.
      const retry = await findStudentByPhone(student_phone)
      student = retry.data as StudentRow | null
    } else if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    } else {
      student = created as StudentRow
    }
  }

  if (!student) return NextResponse.json({ error: '학생 등록에 실패했습니다' }, { status: 500 })

  const { data, error } = await supabase
    .from('attendance_log')
    .insert({
      student_id: student.id,
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

  // UNIQUE(student_id, lecture_id, date) 위반 = 오늘 그 수업에 이미 출석했다.
  // 한 수업당 하루 한 번만 기록되도록 DB 제약이 막아준다.
  if (error?.code === '23505') {
    // 출석은 새로 안 쌓이지만 학생이 왔다는 건 확인됐다.
    // 삭제된 상태였으면 되살리고 이름 변경도 반영한다.
    await syncStudent(student, student_name, student_english_name)
    return NextResponse.json({ already: true })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await syncStudent(student, student_name, student_english_name)

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
