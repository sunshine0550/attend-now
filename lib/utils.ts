import type { Lecture } from '@/types'

const DAY_CHARS = '일월화수목금토'

/** "월화수목" → [1,2,3,4] (getDay 기준) */
export function parseDays(days: string): number[] {
  const set = new Set<number>()
  for (const ch of days) {
    const i = DAY_CHARS.indexOf(ch)
    if (i >= 0) set.add(i)
  }
  return [...set]
}

/**
 * 오늘 날짜(YYYY-MM-DD)를 한국 시간으로 반환.
 * Vercel 서버는 UTC로 동작하므로 new Date()를 그대로 쓰면
 * 한국 기준 오전 9시 이전에 날짜가 하루 밀린다.
 */
export function todayKST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

function toUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** from ~ to (양쪽 포함) 사이에서 days에 해당하는 요일의 날짜 목록 (YYYY-MM-DD, 오름차순) */
export function classDates(days: string, from: string, to: string): string[] {
  const wanted = new Set(parseDays(days))
  if (wanted.size === 0) return []

  const dates: string[] = []
  const end = toUTC(to)
  for (let t = toUTC(from); t <= end; t += 86_400_000) {
    const d = new Date(t)
    if (wanted.has(d.getUTCDay())) dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

/** from ~ to (양쪽 포함) 사이에서 days에 해당하는 요일의 날짜 수 */
export function countClassDays(days: string, from: string, to: string): number {
  return classDates(days, from, to).length
}

/** "2025-09" → { start: "2025-09-01", end: "2025-09-30" } */
export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` }
}

/** ISO 날짜 문자열은 사전순 비교 = 시간순 비교 */
const maxDate = (a: string, b: string) => (a > b ? a : b)
const minDate = (a: string, b: string) => (a < b ? a : b)

type LectureSchedule = Pick<Lecture, 'days' | 'start_date' | 'end_date'>

/** 강의의 해당 월 수업일 목록 (강의 기간과 월 범위의 교집합) */
export function lectureClassDates(lecture: LectureSchedule, month: string): string[] {
  const { start, end } = monthRange(month)
  return classDates(lecture.days, maxDate(start, lecture.start_date), minDate(end, lecture.end_date))
}

/** 강의의 해당 월 총 수업일 수와 오늘까지 진행된 수업일 수 */
export function lectureSessions(lecture: LectureSchedule, month: string): { total: number; held: number } {
  const dates = lectureClassDates(lecture, month)
  const today = todayKST()

  return {
    total: dates.length,
    held: dates.filter((d) => d <= today).length,
  }
}

/** 출석률 기준: 80%↑ green / 60~79% yellow / 60%↓ red */
export function rateTone(rate: number): 'green' | 'yellow' | 'red' {
  if (rate >= 80) return 'green'
  if (rate >= 60) return 'yellow'
  return 'red'
}

/** "01012345678" → "010-1234-5678" (입력 중에도 부분 포맷팅) */
export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

/** "2025-09-06" → "2025. 9. 6 (토)" */
export function formatDateKo(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const day = DAY_CHARS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${y}. ${m}. ${d} (${day})`
}
