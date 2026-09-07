import { rateTone } from '@/lib/utils'
import type { AttendanceRow } from '@/types'

const FILL = { green: 'bg-green', yellow: 'bg-yellow', red: 'bg-red' }
const TEXT = { green: 'text-green', yellow: 'text-yellow', red: 'text-red' }
const TAG = {
  green: 'bg-green/12 text-green',
  yellow: 'bg-yellow/12 text-yellow',
  red: 'bg-red/12 text-red',
}
const LABEL = { green: '정상', yellow: '주의', red: '⚠ 위험' }

export default function AttendanceTable({
  lectureName,
  days,
  total,
  held,
  rows,
}: {
  lectureName: string
  days: string
  total: number
  held: number
  rows: AttendanceRow[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="text-sm font-semibold">
          {lectureName} — {days} 출석부
        </div>
        <div className="text-xs text-text3">
          이번달 총 {total}회 수업 · 현재까지 {held}회 진행
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center text-[13px] text-text3">
          이번달 출석 기록이 없습니다
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['학생', '출석', '출석률', '상태'].map((h) => (
                <th
                  key={h}
                  className="border-b border-border bg-surface2 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text3"
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
                <tr key={r.phone} className={tone === 'red' ? 'bg-red/[0.04]' : undefined}>
                  <td className="border-b border-border/50 px-4 py-3">
                    <div className="text-[13px] font-semibold">{r.name}</div>
                    <div className="mt-px text-[11px] text-text3">{r.english_name}</div>
                  </td>
                  <td className="border-b border-border/50 px-4 py-3 text-xs text-text2">
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
                  <td className="border-b border-border/50 px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${TAG[tone]}`}>
                      {LABEL[tone]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
