import Link from 'next/link'
import type { Lecture } from '@/types'

export default function LectureTabs({
  lectures,
  selectedId,
  basePath,
  month,
  showCount,
}: {
  lectures: Lecture[]
  selectedId: string
  basePath: string
  /** 대시보드에서 탭을 바꿔도 보고 있던 달을 유지하기 위해 함께 넘긴다 */
  month?: string
  /** 탭에 "· N회" 표기 여부 (대시보드는 표기, QR 페이지는 요일만) */
  showCount?: boolean
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {lectures.map((l) => {
        const active = l.id === selectedId
        return (
          <Link
            key={l.id}
            href={`${basePath}?lecture_id=${l.id}${month ? `&month=${month}` : ''}`}
            className={`rounded-lg border px-4 py-[7px] text-[13px] font-medium ${
              active ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface text-text2'
            }`}
          >
            {l.lecture_name}
            <span className="ml-1 text-[10px] text-text3">
              {l.days}
              {showCount && ` · ${l.sessions_per_month}회`}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
