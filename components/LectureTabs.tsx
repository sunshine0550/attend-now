import Link from 'next/link'
import type { Lecture } from '@/types'

/** 전체 탭의 lecture_id 값. 강의 UUID 와 겹치지 않는 고정 문자열 */
export const ALL = 'all'

export default function LectureTabs({
  lectures,
  selectedId,
  basePath,
  month,
  showCount,
  allStudentCount,
}: {
  lectures: Lecture[]
  /** 강의 UUID 또는 ALL */
  selectedId: string
  basePath: string
  /** 대시보드에서 탭을 바꿔도 보고 있던 달을 유지하기 위해 함께 넘긴다 */
  month?: string
  /** 탭에 "· N회" 표기 여부 (대시보드는 표기, QR 페이지는 요일만) */
  showCount?: boolean
  /** 값이 있으면 맨 앞에 전체 탭을 붙인다 (대시보드 전용) */
  allStudentCount?: number
}) {
  const href = (id: string) => `${basePath}?lecture_id=${id}${month ? `&month=${month}` : ''}`
  const cls = (active: boolean) =>
    `rounded-lg border px-4 py-[7px] text-[13px] font-medium ${
      active ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface text-text2'
    }`

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {allStudentCount !== undefined && (
        <Link href={href(ALL)} className={cls(selectedId === ALL)}>
          전체
          <span className="ml-1 text-[10px] text-text3">{allStudentCount}명</span>
        </Link>
      )}

      {lectures.map((l) => (
        <Link key={l.id} href={href(l.id)} className={cls(l.id === selectedId)}>
          {l.lecture_name}
          <span className="ml-1 text-[10px] text-text3">
            {l.days}
            {showCount && ` · ${l.sessions_per_month}회`}
          </span>
        </Link>
      ))}
    </div>
  )
}
