import AttendanceTable from '@/components/AttendanceTable'
import LectureTabs from '@/components/LectureTabs'
import Shell from '@/components/Shell'
import StatsCard from '@/components/StatsCard'
import { getLectureAttendance, getLectures, getStudents, getTodayAttendance } from '@/lib/queries'
import { lectureClassDates, monthRange, todayKST } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ lecture_id?: string }>
}) {
  const { lecture_id } = await searchParams
  const month = todayKST().slice(0, 7)
  const [lectures, students] = await Promise.all([getLectures(month), getStudents()])

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
  const [rows, todayLogs] = await Promise.all([
    getLectureAttendance(selected.id, month),
    getTodayAttendance(selected.id),
  ])

  const avgRate = rows.length ? Math.round(rows.reduce((s, r) => s + r.rate, 0) / rows.length) : 0
  const atRisk = rows.filter((r) => r.rate < 80).length
  const { start, end } = monthRange(month)
  const [y, m] = month.split('-').map(Number)

  return (
    <Shell title={`${m}월 출석 현황`} sub={`${y}년 ${start.slice(8)}일 — ${m}월 ${Number(end.slice(8))}일`}>
      <div className="mb-7 grid grid-cols-4 gap-4">
        <StatsCard label="전체 학생" value={students.length} unit="명" sub="등록된 학생 전체" />
        <StatsCard
          label="평균 출석률"
          value={avgRate}
          unit="%"
          sub={`${selected.lecture_name} 기준`}
          tone={avgRate >= 80 ? 'green' : avgRate >= 60 ? 'yellow' : 'red'}
        />
        <StatsCard
          label="오늘 출석"
          value={todayLogs.length}
          unit="명"
          sub={`${selected.lecture_name} · ${rows.length}명 중`}
        />
        <StatsCard label="위험군 (80% 미만)" value={atRisk} unit="명" sub={atRisk ? '관리 필요' : '없음'} tone="red" />
      </div>

      <LectureTabs lectures={lectures} selectedId={selected.id} basePath="/" showCount />

      <AttendanceTable
        lectureName={selected.lecture_name}
        days={selected.days}
        total={selected.total}
        held={selected.held}
        sessionDates={lectureClassDates(selected, month)}
        rows={rows}
      />
    </Shell>
  )
}
