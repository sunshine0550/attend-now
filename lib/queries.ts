import { supabase } from './supabase'
import { lectureSessions, monthRange, todayKST } from './utils'
import type { AttendanceLog, AttendanceRow, Lecture, LectureWithSessions, Student } from '@/types'

/**
 * API Route와 서버 컴포넌트가 같은 집계 로직을 쓰도록 여기 모아둔다.
 * (서버 컴포넌트가 자기 API를 HTTP로 다시 호출하지 않게 하려는 목적)
 */

export async function getLectures(month = todayKST().slice(0, 7)): Promise<LectureWithSessions[]> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .is('deleted_at', null)
    .eq('active', true)
    .order('created_at')

  if (error) throw new Error(error.message)
  return (data as Lecture[]).map((l) => ({ ...l, ...lectureSessions(l, month) }))
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
 * 분모(total)는 오늘까지 진행된 수업일 수.
 */
export async function getLectureAttendance(lectureId: string, month: string): Promise<AttendanceRow[]> {
  const lecture = await getLecture(lectureId)
  if (!lecture) return []

  const { held } = lectureSessions(lecture, month)
  const { start, end } = monthRange(month)

  const { data, error } = await supabase
    .from('attendance_log')
    .select('student_phone, student_name, student_english_name, date')
    .eq('lecture_id', lectureId)
    .is('deleted_at', null)
    .gte('date', start)
    .lte('date', end)
    .order('date')

  if (error) throw new Error(error.message)

  const byPhone = new Map<string, AttendanceRow>()
  for (const log of data ?? []) {
    const row = byPhone.get(log.student_phone)
    if (row) {
      row.attended++
      row.dates.push(log.date)
      // 날짜 오름차순이므로 가장 최근에 입력한 이름이 남는다
      row.name = log.student_name
      row.english_name = log.student_english_name
    } else {
      byPhone.set(log.student_phone, {
        name: log.student_name,
        english_name: log.student_english_name,
        phone: log.student_phone,
        attended: 1,
        total: held,
        rate: 0,
        dates: [log.date],
      })
    }
  }

  return [...byPhone.values()]
    .map((r) => ({ ...r, rate: held ? Math.round((r.attended / held) * 100) : 0 }))
    .sort((a, b) => a.rate - b.rate || a.name.localeCompare(b.name, 'ko'))
}

/** QR 페이지 polling용 — 오늘 그 강의에 출석한 학생 (최근 순) */
export async function getTodayAttendance(lectureId: string): Promise<AttendanceLog[]> {
  const { data, error } = await supabase
    .from('attendance_log')
    .select('*')
    .eq('lecture_id', lectureId)
    .eq('date', todayKST())
    .is('deleted_at', null)
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

/** 학생 상세 — 전화번호로 모든 출석 기록 조회 (최근 순) */
export async function getStudentLogs(phone: string): Promise<AttendanceLog[]> {
  const { data, error } = await supabase
    .from('attendance_log')
    .select('*')
    .eq('student_phone', phone)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AttendanceLog[]
}
