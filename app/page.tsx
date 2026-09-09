import Link from 'next/link'
import AttendanceTable from '@/components/AttendanceTable'
import LectureTabs from '@/components/LectureTabs'
import Shell from '@/components/Shell'
import StatsCard from '@/components/StatsCard'
import { getLectureAttendance, getLectures, getStudents, getTodayAttendance } from '@/lib/queries'
import { shiftMonth, todayKST } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ lecture_id?: string; month?: string }>
}) {
  const { lecture_id, month: monthParam } = await searchParams

  const currentMonth = todayKST().slice(0, 7)
  // 미래 달은 데이터가 없으니 이번달까지만 본다
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) && monthParam <= currentMonth ? monthParam : currentMonth
  const isCurrentMonth = month === currentMonth

  const [lectures, students] = await Promise.all([getLectures(), getStudents()])

  if (lectures.length === 0) {
    return (
      <Shell title="출석 현황" sub="등록된 강의가 없습니다">
        <div className="rounded-xl border border-border bg-surface px-5 py-12 text-center text-[13px] text-text3">
          먼저 <span className="text-accent">강의 설정</span>에서 강의를 추가하세요
        </div>
      </Shell>
    )
  }

  const selected = lectures.find((l) => l.id === lecture_id) ?? lectures[0]
  const [{ rows, sessionDates }, todayLogs] = await Promise.all([
    getLectureAttendance(selected, month),
    isCurrentMonth ? getTodayAttendance(selected.id) : Promise.resolve([]),
  ])

  const avgRate = rows.length ? Math.round(rows.reduce((s, r) => s + r.rate, 0) / rows.length) : 0
  const atRisk = rows.filter((r) => r.rate < 80).length
  const totalAttended = rows.reduce((s, r) => s + r.attended, 0)
  const [y, m] = month.split('-').map(Number)

  const prevMonth = shiftMonth(month, -1)
  const nextMonth = shiftMonth(month, 1)
  const linkFor = (mo: string) => `/?lecture_id=${selected.id}&month=${mo}`

  return (
    <Shell
      title={`${y}년 ${m}월 출석 현황`}
      sub={isCurrentMonth ? '이번달' : '지난 기록'}
      action={
        <div className="flex items-center gap-1">
          <Link
            href={linkFor(prevMonth)}
            aria-label="이전 달"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text2 hover:text-accent"
          >
            ◀
          </Link>
          <span className="min-w-[64px] text-center text-xs font-semibold sm:min-w-[80px] sm:text-[13px]">{month.replace('-', '. ')}</span>
          {isCurrentMonth ? (
            <span
              aria-disabled
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text3 opacity-40"
            >
              ▶
            </span>
          ) : (
            <Link
              href={linkFor(nextMonth)}
              aria-label="다음 달"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text2 hover:text-accent"
            >
              ▶
            </Link>
          )}
        </div>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-7 lg:grid-cols-4 lg:gap-4">
        <StatsCard label="전체 학생" value={students.length} unit="명" sub="등록된 학생 전체" />
        <StatsCard
          label="평균 출석률"
          value={avgRate}
          unit="%"
          sub={`${selected.lecture_name} 기준`}
          tone={avgRate >= 80 ? 'green' : avgRate >= 60 ? 'yellow' : 'red'}
        />
        {isCurrentMonth ? (
          <StatsCard
            label="오늘 출석"
            value={todayLogs.length}
            unit="명"
            sub={`${selected.lecture_name} · ${rows.length}명 중`}
          />
        ) : (
          <StatsCard label="총 출석" value={totalAttended} unit="건" sub={`${selected.lecture_name} · ${m}월 전체`} />
        )}
        <StatsCard label="위험군 (80% 미만)" value={atRisk} unit="명" sub={atRisk ? '관리 필요' : '없음'} tone="red" />
      </div>

      <LectureTabs lectures={lectures} selectedId={selected.id} basePath="/" month={month} showCount />

      <AttendanceTable
        lectureName={selected.lecture_name}
        days={selected.days}
        sessionsPerMonth={selected.sessions_per_month}
        sessionDates={sessionDates}
        rows={rows}
      />
    </Shell>
  )
}
