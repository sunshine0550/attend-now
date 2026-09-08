'use client'

import { useEffect, useState } from 'react'
import type { AttendanceLog } from '@/types'

const AVATAR_GRADIENTS = [
  'from-[#5B8DF6] to-[#7C5CF6]',
  'from-[#34D399] to-[#059669]',
  'from-[#FBBF24] to-[#D97706]',
]

/** 오늘 출석 현황을 10초마다 polling */
export default function LivePanel({
  lectureId,
  enrolled,
  compact,
}: {
  lectureId: string
  /** 이번달 이 강의에 출석 기록이 있는 학생 수 (분모) */
  enrolled: number
  /** 전체화면 모드용 큰 레이아웃 */
  compact?: boolean
}) {
  const [logs, setLogs] = useState<AttendanceLog[]>([])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      const res = await fetch(`/api/attendance/today?lecture_id=${lectureId}`)
      if (!res.ok || cancelled) return
      setLogs(await res.json())
    }

    poll()
    const timer = setInterval(poll, 10_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [lectureId])

  // enrolled 는 페이지 로드 시점의 값이고 logs 는 10초마다 갱신되므로,
  // 이번달 첫 수업처럼 enrolled 가 아직 작을 때 "18 / 0명" 이 되는 것을 막는다
  const total = Math.max(enrolled, logs.length)
  const pct = total ? Math.round((logs.length / total) * 100) : 0

  if (compact) {
    return (
      <>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-[56px] font-extrabold leading-none text-green">{logs.length}</span>
          <span className="text-[22px] text-neutral-600">/ {total}명 출석</span>
        </div>
        <div className="mb-6 h-2 w-[280px] rounded-full bg-neutral-800">
          <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-4 rounded-xl border border-border bg-surface p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text3">실시간 출석 현황</div>
          <div className="h-2 w-2 rounded-full bg-green shadow-[0_0_6px_var(--color-green)]" />
        </div>
        <div className="mb-1 text-4xl font-extrabold leading-none">
          {logs.length}
          <span className="text-base font-medium text-text3"> / {total}명</span>
        </div>
        <div className="my-3 h-1.5 rounded-full bg-border">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-text3">미출석 {total - logs.length}명 · 10초마다 갱신</div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text3">최근 출석</div>
        {logs.length === 0 ? (
          <div className="py-2 text-xs text-text3">아직 출석한 학생이 없습니다</div>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.slice(0, 3).map((log, i) => (
              <div key={log.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white ${
                      AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]
                    }`}
                  >
                    {log.student_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{log.student_name}</div>
                    <div className="text-[10px] text-text3">{log.student_english_name}</div>
                  </div>
                </div>
                <span className="text-[11px] text-text3">
                  {new Date(log.attended_at).toLocaleTimeString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
