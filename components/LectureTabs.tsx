import Link from 'next/link'
import type { LectureWithSessions } from '@/types'

export default function LectureTabs({
  lectures,
  selectedId,
  basePath,
  showCount,
}: {
  lectures: LectureWithSessions[]
  selectedId: string
  basePath: string
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
            href={`${basePath}?lecture_id=${l.id}`}
            className={`rounded-lg border px-4 py-[7px] text-[13px] font-medium ${
              active ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface text-text2'
            }`}
          >
            {l.lecture_name}
            <span className="ml-1 text-[10px] text-text3">
              {l.days}
              {showCount && ` · ${l.total}회`}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
