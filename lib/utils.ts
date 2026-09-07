/**
 * Vercel 서버는 UTC로 동작하므로 new Date()를 그대로 쓰면
 * 한국 기준 오전 9시 이전에 날짜가 하루 밀린다. 항상 KST로 환산한다.
 */
const KST_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })

/** 오늘 날짜 (YYYY-MM-DD, KST) */
export function todayKST(): string {
  return KST_DATE.format(new Date())
}

/** "2026-09" + 1 → "2026-10" */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** "2025-09" → { start: "2025-09-01", end: "2025-09-30" } */
export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` }
}

/** 출석률 기준: 80%↑ green / 60~79% yellow / 60%↓ red */
export function rateTone(rate: number): 'green' | 'yellow' | 'red' {
  if (rate >= 80) return 'green'
  if (rate >= 60) return 'yellow'
  return 'red'
}

/**
 * "10:00:00" → "오전 10:00"
 * Postgres TIME 은 날짜가 없어서 Date 로 변환하면 시간대가 끼어든다. 직접 파싱한다.
 */
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h < 12 ? '오전' : '오후'} ${h12}:${String(m).padStart(2, '0')}`
}

/** 수업 시간 표시. 시작 시각이 없으면 null (화면에서 아예 숨긴다) */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start) return null
  return end ? `${formatTime(start)} — ${formatTime(end)}` : formatTime(start)
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
  const day = '일월화수목금토'[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${y}. ${m}. ${d} (${day})`
}
