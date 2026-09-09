export type Lecture = {
  id: string
  teacher_id: string
  lecture_name: string
  /** 표시용 — "월화수목" / "토" / "일" / "토일" */
  days: string
  /** 출석률 분모. 달력이 아니라 선생님 기준값 (월화수목 16, 토·일 4, 토일 8) */
  sessions_per_month: number
  /** 수업 시작 시각 "10:00:00" — 미설정이면 null */
  start_time: string | null
  end_time: string | null
  active: boolean
}

export type Student = {
  id: string
  name: string
  english_name: string
  phone: string
  /** 등록 시각 — "이번달 신규 N명" 집계에 쓴다 */
  created_at: string
}

export type AttendanceLog = {
  id: string
  student_id: string
  /** 그날 학생이 입력한 이름 스냅샷 (students 의 현재 이름과 다를 수 있음) */
  student_name: string
  student_english_name: string
  lecture_id: string
  lecture_name: string
  attended_at: string
  date: string
}

export type AttendanceRow = {
  student_id: string
  name: string
  english_name: string
  attended: number
  /** 분모 — 강의의 sessions_per_month (고정) */
  total: number
  rate: number
  /** 이 학생이 출석한 날짜 — 이번달 기록 칸 색칠용 */
  dates: string[]
  /** 전체 탭에서만 채워진다 — 이 학생이 이번달 출석한 강의 수 */
  lectureCount?: number
}

export type LectureAttendance = {
  rows: AttendanceRow[]
  /**
   * 이번달 수업이 열린 날짜 (오름차순).
   * 누군가 출석한 날 = 수업이 있었던 날로 본다. N번째 원소가 N번째 수업이다.
   */
  sessionDates: string[]
}
