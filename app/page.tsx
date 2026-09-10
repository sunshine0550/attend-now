import Link from 'next/link'
import AttendanceTable from '@/components/AttendanceTable'
import LectureTabs, { ALL } from '@/components/LectureTabs'
import Shell from '@/components/Shell'
import StatsCard from '@/components/StatsCard'
import { requireTeacher } from '@/lib/auth/session'
import {
  getAllAttendance,
  getLectureAttendance,
  getLectures,
  getNewStudentCount,
  getStudentCount,
  getTodayAttendance,
} from '@/lib/queries'
import { shiftMonth, todayKST } from '@/lib/utils'
import type { LectureAttendance } from '@/types'

export const dynamic = 'force-dynamic'

/** 전월 대비 증감 문구. 0이면 화살표 없이 '전월과 동일' */
function delta(current: number, previous: number, unit: string) {
  const diff = current - previous
  if (diff === 0) return { trend: 'flat' as const, text: `전월과 동일 (${previous}${unit})` }

  return {
    trend: diff > 0 ? ('up' as const) : ('down' as const),
    text: `${diff > 0 ? '↑' : '↓'} 전월 대비 ${diff > 0 ? '+' : ''}${diff}${unit}`,
  }
}

const avgRateOf = (a: LectureAttendance) =>
  a.rows.length ? Math.round(a.rows.reduce((s, r) => s + r.rate, 0) / a.rows.length) : 0

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ lecture_id?: string; month?: string }>
}) {
  const { lecture_id, month: monthParam } = await searchParams
  const teacher = await requireTeacher()

  const currentMonth = todayKST().slice(0, 7)
  // 미래 달은 데이터가 없으니 이번달까지만 본다
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) && monthParam <= currentMonth ? monthParam : currentMonth
  const prevMonth = shiftMonth(month, -1)
  const isCurrentMonth = month === currentMonth

  const [lectures, studentCount] = await Promise.all([getLectures(teacher.id), getStudentCount(teacher.id)])

  if (lectures.length === 0) {
    return (
      <Shell teacherName={teacher.name} title="출석 현황" sub="등록된 강의가 없습니다">
        <div className="rounded-xl border border-border bg-surface px-5 py-12 text-center text-[13px] text-text3">
          먼저 <span className="text-accent">강의 설정</span>에서 강의를 추가하세요
        </div>
      </Shell>
    )
  }

  // 기본은 전체 탭. lecture_id 가 실제 강의를 가리킬 때만 그 강의로 좁힌다
  const selected = lectures.find((l) => l.id === lecture_id) ?? null
  const scopeId = selected?.id ?? ALL

  const [current, previous, todayLogs, newStudents, prevNewStudents] = await Promise.all([
    selected ? getLectureAttendance(selected, month) : getAllAttendance(lectures, month),
    selected ? getLectureAttendance(selected, prevMonth) : getAllAttendance(lectures, prevMonth),
    isCurrentMonth && selected ? getTodayAttendance(selected.id) : Promise.resolve([]),
    getNewStudentCount(teacher.id, month),
    getNewStudentCount(teacher.id, prevMonth),
  ])

  const avgRate = avgRateOf(current)
  const atRisk = current.rows.filter((r) => r.rate < 80).length
  const prevAtRisk = previous.rows.filter((r) => r.rate < 80).length
  const totalAttended = current.rows.reduce((s, r) => s + r.attended, 0)

  const rateDelta = delta(avgRate, avgRateOf(previous), '%p')
  const riskDelta = delta(atRisk, prevAtRisk, '명')
  const studentDelta = delta(newStudents, prevNewStudents, '명')

  const [y, m] = month.split('-').map(Number)
  const scopeName = selected?.lecture_name ?? '전체 강의'
  const linkFor = (mo: string) => `/?lecture_id=${scopeId}&month=${mo}`

  return (
    <Shell
      teacherName={teacher.name}
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
          <span className="min-w-[64px] text-center text-xs font-semibold sm:min-w-[80px] sm:text-[13px]">
            {month.replace('-', '. ')}
          </span>
          {isCurrentMonth ? (
            <span
              aria-disabled
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text3 opacity-40"
            >
              ▶
            </span>
          ) : (
            <Link
              href={linkFor(shiftMonth(month, 1))}
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
        <StatsCard
          label="전체 학생"
          value={studentCount}
          unit="명"
          sub={newStudents ? `↑ ${newStudents}명 이번 달 추가` : studentDelta.text}
          trend={newStudents ? 'up' : studentDelta.trend}
        />
        <StatsCard
          label="평균 출석률"
          value={avgRate}
          unit="%"
          sub={rateDelta.text}
          trend={rateDelta.trend}
          tone={avgRate >= 80 ? 'green' : avgRate >= 60 ? 'yellow' : 'red'}
        />
        {isCurrentMonth && selected ? (
          <StatsCard
            label="오늘 출석"
            value={todayLogs.length}
            unit="명"
            sub={`${current.rows.length}명 중 ${todayLogs.length}명`}
            trend={todayLogs.length ? 'up' : 'flat'}
          />
        ) : (
          <StatsCard label="총 출석" value={totalAttended} unit="건" sub={`${scopeName} · ${m}월 전체`} trend="flat" />
        )}
        <StatsCard
          label="위험군 (80% 미만)"
          value={atRisk}
          unit="명"
          sub={atRisk ? riskDelta.text : '없음'}
          // 위험군은 줄어드는 게 좋으므로 증감 색을 뒤집는다
          trend={atRisk ? (riskDelta.trend === 'up' ? 'down' : riskDelta.trend === 'down' ? 'up' : 'flat') : 'flat'}
          tone="red"
        />
      </div>

      <LectureTabs
        lectures={lectures}
        selectedId={scopeId}
        basePath="/"
        month={month}
        showCount
        allStudentCount={studentCount}
      />

      <AttendanceTable
        title={selected ? `${selected.lecture_name} — ${selected.days} 출석부` : '전체 강의 출석부'}
        meta={
          selected
            ? `기준 ${selected.sessions_per_month}회 · ${current.sessionDates.length}회 진행`
            : `강의 ${lectures.length}개 합산 · 학생별 기준 횟수 다름`
        }
        sessionsPerMonth={selected?.sessions_per_month ?? null}
        sessionDates={current.sessionDates}
        rows={current.rows}
      />
    </Shell>
  )
}
