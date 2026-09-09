import { rateTone } from '@/lib/utils'
import type { AttendanceRow } from '@/types'

const FILL = { green: 'bg-green', yellow: 'bg-yellow', red: 'bg-red' }
const TEXT = { green: 'text-green', yellow: 'text-yellow', red: 'text-red' }

/**
 * 이번달 기록 — 수업 횟수만큼 칸을 그린다.
 * N번째 칸 = N번째 수업. 출석했으면 초록, 빠졌으면 빨강, 아직 안 한 수업은 회색.
 */
function SessionSlots({
  sessionDates,
  attended,
  slots,
}: {
  sessionDates: string[]
  attended: string[]
  slots: number
}) {
  const present = new Set(attended)

  return (
    <div className="flex gap-1">
      {Array.from({ length: slots }, (_, i) => {
        const date = sessionDates[i]

        // 아직 진행되지 않은 수업
        if (!date) {
          return (
            <div
              key={i}
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-border text-[9px] font-semibold text-text3"
            >
              {i + 1}
            </div>
          )
        }

        const here = present.has(date)
        return (
          <div
            key={i}
            title={`${i + 1}번째 수업 · ${date} · ${here ? '출석' : '결석'}`}
            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[9px] font-semibold ${
              here ? 'bg-green/20 text-green' : 'bg-red/15 text-red'
            }`}
          >
            {i + 1}
          </div>
        )
      })}
    </div>
  )
}

export default function AttendanceTable({
  title,
  meta,
  sessionsPerMonth,
  sessionDates,
  rows,
}: {
  title: string
  meta: string
  /**
   * 출석률 분모이자 기록 칸 수.
   * 전체 탭에서는 학생마다 분모가 달라 칸을 그릴 수 없으므로 null 을 넘긴다.
   */
  sessionsPerMonth: number | null
  /** 이번달 수업이 열린 날짜 (오름차순) */
  sessionDates: string[]
  rows: AttendanceRow[]
}) {
  const perLecture = sessionsPerMonth !== null
  // 기준보다 수업이 더 열렸으면 칸을 늘려서 감추지 않는다
  const slots = perLecture ? Math.max(sessionsPerMonth, sessionDates.length) : 0

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-1 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="text-sm font-semibold">{title}</div>
        {/* 지난 달도 볼 수 있으므로 "이번달" 같은 표현을 쓰지 않는다 (월은 페이지 제목에 있다) */}
        <div className="text-xs text-text3">{meta}</div>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center text-[13px] text-text3">출석 기록이 없습니다</div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse ${perLecture ? 'min-w-[680px]' : 'min-w-[460px]'}`}>
            <thead>
              <tr>
                {['학생', '출석', '출석률', perLecture ? '이번달 기록' : '수강 강의'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap border-b border-border bg-surface2 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const tone = rateTone(r.rate)
                return (
                  <tr key={r.student_id}>
                    <td className="border-b border-border/50 px-4 py-3">
                      <div className="text-[13px] font-semibold">{r.name}</div>
                      <div className="mt-px text-[11px] text-text3">{r.english_name}</div>
                    </td>
                    <td className="whitespace-nowrap border-b border-border/50 px-4 py-3 text-xs text-text2">
                      {r.attended} / {r.total}회
                    </td>
                    <td className="border-b border-border/50 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-[5px] w-20 overflow-hidden rounded-full bg-border">
                          <div className={`h-full rounded-full ${FILL[tone]}`} style={{ width: `${r.rate}%` }} />
                        </div>
                        <div className={`min-w-[38px] text-right text-[13px] font-semibold ${TEXT[tone]}`}>
                          {r.rate}%
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap border-b border-border/50 px-4 py-3">
                      {perLecture ? (
                        <SessionSlots sessionDates={sessionDates} attended={r.dates} slots={slots} />
                      ) : (
                        <span className="text-xs text-text2">{r.lectureCount}개</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
