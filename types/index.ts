export type Lecture = {
  id: string
  teacher_id: string
  lecture_name: string
  /** "토" / "월화수목" / "월화수목금" */
  days: string
  start_date: string
  end_date: string
  active: boolean
}

export type LectureWithSessions = Lecture & {
  /** 이번달 총 수업일 수 */
  total: number
  /** 이번달 중 오늘까지 진행된 수업일 수 */
  held: number
}

export type Student = {
  id: string
  name: string
  english_name: string
  phone: string
}

export type AttendanceLog = {
  id: string
  student_phone: string
  student_name: string
  student_english_name: string
  lecture_id: string
  lecture_name: string
  attended_at: string
  date: string
}

export type AttendanceRow = {
  name: string
  english_name: string
  phone: string
  attended: number
  /** 분모 — 오늘까지 진행된 수업일 수 */
  total: number
  rate: number
}
