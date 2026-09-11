import { supabase } from './supabase'
import { monthRange, todayKST } from './utils'
import type { AttendanceLog, AttendanceRow, Lecture, LectureAttendance, Student } from '@/types'

/**
 * API Route와 서버 컴포넌트가 같은 집계 로직을 쓰도록 여기 모아둔다.
 * (서버 컴포넌트가 자기 API를 HTTP로 다시 호출하지 않게 하려는 목적)
 */

/** 그 선생님의 강의만 */
export async function getLectures(teacherId: string): Promise<Lecture[]> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('teacher_id', teacherId)
    .is('deleted_at', null)
    .eq('active', true)
    .order('created_at')

  if (error) throw new Error(error.message)
  return (data ?? []) as Lecture[]
}

/**
 * 강의 하나.
 * teacherId 를 주면 그 선생님 강의인지까지 확인한다(남의 강의 UUID 를 URL 에
 * 넣어도 열리지 않게). 학생 출석 페이지는 세션이 없으므로 생략한다.
 */
export async function getLecture(id: string, teacherId?: string): Promise<Lecture | null> {
  let query = supabase.from('lectures').select('*').eq('id', id).is('deleted_at', null)
  if (teacherId) query = query.eq('teacher_id', teacherId)

  const { data, error } = await query.maybeSingle()

  if (error) throw new Error(error.message)
  return data as Lecture | null
}

/**
 * 강의 학생 목록 = 해당 월에 그 강의로 한 번이라도 출석한 학생.
 * (students↔lectures 수강등록 테이블이 없어 attendance_log가 유일한 연결점)
 *
 * 강의 객체를 그대로 받는다 — 호출자가 이미 갖고 있는데 id 로 다시 조회하면
 * DB 왕복이 한 번 더 늘고, 그 왕복이 끝나야 다음 쿼리가 시작되므로 첫 응답이 그만큼 느려진다.
 *
 * 출석률 분모는 달력 계산이 아니라 강의의 sessions_per_month 고정값이다.
 * sessionDates 는 "몇 번째 수업이 언제였나"를 알기 위한 것으로,
 * 누군가 출석한 날짜를 수업이 열린 날로 본다.
 */
export async function getLectureAttendance(lecture: Lecture, month: string): Promise<LectureAttendance> {
  const { start, end } = monthRange(month)

  // students!inner + students.deleted_at 필터 = 삭제된 학생의 출석 기록은 제외.
  // 중간에 그만둔 학생을 삭제하면 그 달 출석 기록까지 출석부에서 사라져야 한다.
  const { data, error } = await supabase
    .from('attendance_log')
    .select('student_id, student_name, student_english_name, date, students!inner(id)')
    .eq('lecture_id', lecture.id)
    .is('deleted_at', null)
    .is('students.deleted_at', null)
    .gte('date', start)
    .lte('date', end)
    .order('date')

  if (error) throw new Error(error.message)

  const total = lecture.sessions_per_month
  const sessionDates = [...new Set((data ?? []).map((l) => l.date))].sort()
  const byStudent = new Map<string, AttendanceRow>()

  for (const log of data ?? []) {
    const row = byStudent.get(log.student_id)
    if (row) {
      row.attended++
      row.dates.push(log.date)
      // 날짜 오름차순이므로 가장 최근에 입력한 이름이 남는다
      row.name = log.student_name
      row.english_name = log.student_english_name
    } else {
      byStudent.set(log.student_id, {
        student_id: log.student_id,
        name: log.student_name,
        english_name: log.student_english_name,
        attended: 1,
        total,
        rate: 0,
        dates: [log.date],
      })
    }
  }

  const rows = [...byStudent.values()]
    // 실제 수업이 기준값보다 많이 열리면 100%를 넘을 수 있어 상한을 둔다
    .map((r) => ({ ...r, rate: total ? Math.min(100, Math.round((r.attended / total) * 100)) : 0 }))
    .sort((a, b) => a.rate - b.rate || a.name.localeCompare(b.name, 'ko'))

  return { rows, sessionDates }
}

/**
 * 전체 탭 — 모든 강의를 통틀어 학생별 출석 집계.
 *
 * 분모는 그 학생이 이번달 출석한 강의들의 sessions_per_month 합이다.
 * (1개 강의만 들으면 16, 2개면 32 — 학생이 실제로 지는 부담만큼만 센다)
 *
 * sessionDates 는 비워서 돌려준다. "N번째 수업" 은 강의별 개념이라
 * 여러 강의를 합치면 의미가 없어진다.
 */
export async function getAllAttendance(lectures: Lecture[], month: string): Promise<LectureAttendance> {
  if (lectures.length === 0) return { rows: [], sessionDates: [] }

  const { start, end } = monthRange(month)
  const sessionsById = new Map(lectures.map((l) => [l.id, l.sessions_per_month]))

  const { data, error } = await supabase
    .from('attendance_log')
    .select('student_id, student_name, student_english_name, date, lecture_id, students!inner(id)')
    .in(
      'lecture_id',
      lectures.map((l) => l.id),
    )
    .is('deleted_at', null)
    .is('students.deleted_at', null)
    .gte('date', start)
    .lte('date', end)
    .order('date')

  if (error) throw new Error(error.message)

  type Acc = { row: AttendanceRow; lectureIds: Set<string> }
  const byStudent = new Map<string, Acc>()

  for (const log of data ?? []) {
    const acc = byStudent.get(log.student_id)
    if (acc) {
      acc.row.attended++
      acc.row.dates.push(log.date)
      acc.row.name = log.student_name
      acc.row.english_name = log.student_english_name
      acc.lectureIds.add(log.lecture_id)
    } else {
      byStudent.set(log.student_id, {
        row: {
          student_id: log.student_id,
          name: log.student_name,
          english_name: log.student_english_name,
          attended: 1,
          total: 0,
          rate: 0,
          dates: [log.date],
        },
        lectureIds: new Set([log.lecture_id]),
      })
    }
  }

  const rows = [...byStudent.values()]
    .map(({ row, lectureIds }) => {
      const total = [...lectureIds].reduce((s, id) => s + (sessionsById.get(id) ?? 0), 0)
      return {
        ...row,
        total,
        rate: total ? Math.min(100, Math.round((row.attended / total) * 100)) : 0,
        lectureCount: lectureIds.size,
      }
    })
    .sort((a, b) => a.rate - b.rate || a.name.localeCompare(b.name, 'ko'))

  return { rows, sessionDates: [] }
}

/** 해당 월에 새로 등록된 학생 수 (삭제된 학생 제외) */
export async function getNewStudentCount(teacherId: string, month: string): Promise<number> {
  const ids = await studentIdsOf(teacherId)
  if (ids.length === 0) return 0

  const { start, end } = monthRange(month)

  const { count, error } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .in('id', ids)
    .is('deleted_at', null)
    .gte('created_at', `${start}T00:00:00+09:00`)
    .lte('created_at', `${end}T23:59:59+09:00`)

  if (error) throw new Error(error.message)
  return count ?? 0
}

/** QR 페이지 polling용 — 오늘 그 강의에 출석한 학생 (최근 순). 삭제된 학생은 제외 */
export async function getTodayAttendance(lectureId: string): Promise<AttendanceLog[]> {
  const { data, error } = await supabase
    .from('attendance_log')
    .select('*, students!inner(id)')
    .eq('lecture_id', lectureId)
    .eq('date', todayKST())
    .is('deleted_at', null)
    .is('students.deleted_at', null)
    .order('attended_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AttendanceLog[]
}

/**
 * 그 선생님 강의에 한 번이라도 출석한 학생의 id 집합.
 * students 테이블에는 선생님 구분이 없어서 attendance_log → lectures 로 거른다.
 */
async function studentIdsOf(teacherId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('attendance_log')
    .select('student_id, lectures!inner(teacher_id)')
    .eq('lectures.teacher_id', teacherId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)
  return [...new Set((data ?? []).map((r) => r.student_id))]
}

export type StudentPage = { students: Student[]; nextCursor: string | null }

/**
 * 학생 목록. 영어 이름 오름차순, 커서 기반 페이지네이션.
 *
 * offset 이 아니라 커서(마지막 영어 이름)를 쓰는 이유: 스크롤 중에 학생이
 * 추가/삭제되면 offset 은 항목을 건너뛰거나 중복으로 보여준다.
 */
export async function getStudents(
  teacherId: string,
  { q, cursor, limit = 10 }: { q?: string; cursor?: string; limit?: number } = {},
): Promise<StudentPage> {
  const ids = await studentIdsOf(teacherId)
  if (ids.length === 0) return { students: [], nextCursor: null }

  let query = supabase
    .from('students')
    .select('*')
    .in('id', ids)
    .is('deleted_at', null)
    .order('english_name')
    .order('id') // 영어 이름이 같을 때 순서를 고정해 커서가 흔들리지 않게
    .limit(limit + 1) // 한 개 더 받아 다음 페이지 존재 여부를 판단

  if (q?.trim()) {
    const term = q.trim().replace(/[%,]/g, '')
    query = query.or(`name.ilike.%${term}%,english_name.ilike.%${term}%,phone.ilike.%${term}%`)
  }
  if (cursor) query = query.gt('english_name', cursor)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Student[]
  const hasMore = rows.length > limit
  const students = hasMore ? rows.slice(0, limit) : rows

  return {
    students,
    nextCursor: hasMore ? students[students.length - 1].english_name : null,
  }
}

/** 그 선생님 강의에 출석한 학생 총 인원 */
export async function getStudentCount(teacherId: string): Promise<number> {
  return (await studentIdsOf(teacherId)).length
}

/** 내 강의 학생이 아니면 null (남의 학생 상세를 URL 로 열 수 없게) */
export async function getStudentById(id: string, teacherId: string): Promise<Student | null> {
  const ids = await studentIdsOf(teacherId)
  if (!ids.includes(id)) return null

  return getStudentRow(id)
}

async function getStudentRow(id: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Student | null
}

/** 학생 상세 — 그 학생의 모든 출석 기록 (최근 순) */
export async function getStudentLogs(studentId: string): Promise<AttendanceLog[]> {
  const { data, error } = await supabase
    .from('attendance_log')
    .select('*')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AttendanceLog[]
}
