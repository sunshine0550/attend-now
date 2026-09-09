import { supabase } from './supabase'
import { monthRange, todayKST } from './utils'
import type { AttendanceLog, AttendanceRow, Lecture, LectureAttendance, Student } from '@/types'

/**
 * API Route와 서버 컴포넌트가 같은 집계 로직을 쓰도록 여기 모아둔다.
 * (서버 컴포넌트가 자기 API를 HTTP로 다시 호출하지 않게 하려는 목적)
 */

export async function getLectures(): Promise<Lecture[]> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .is('deleted_at', null)
    .eq('active', true)
    .order('created_at')

  if (error) throw new Error(error.message)
  return (data ?? []) as Lecture[]
}

export async function getLecture(id: string): Promise<Lecture | null> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

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

export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Student[]
}

export async function getStudentById(id: string): Promise<Student | null> {
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
