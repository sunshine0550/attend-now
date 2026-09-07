import Link from 'next/link'
import { notFound } from 'next/navigation'
import Shell from '@/components/Shell'
import StatsCard from '@/components/StatsCard'
import { getLectures, getStudentById, getStudentLogs } from '@/lib/queries'
import { formatDateKo, monthRange, rateTone, todayKST } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const RATE_TEXT = { green: 'text-green', yellow: 'text-yellow', red: 'text-red' }
const RATE_TAG = { green: 'bg-green/12 text-green', yellow: 'bg-yellow/12 text-yellow', red: 'bg-red/12 text-red' }

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const student = await getStudentById(id)
  if (!student) notFound()

  const month = todayKST().slice(0, 7)
  const { start, end } = monthRange(month)
  const [lectures, logs] = await Promise.all([getLectures(month), getStudentLogs(student.phone)])

  const monthLogs = logs.filter((l) => l.date >= start && l.date <= end)

  // 이번달 출석 기록이 있는 강의만 집계 (수강등록 테이블이 없어 출석 기록이 유일한 연결점)
  const perLecture = lectures
    .map((lecture) => {
      const attended = monthLogs.filter((l) => l.lecture_id === lecture.id).length
      return {
        lecture,
        attended,
        rate: lecture.held ? Math.round((attended / lecture.held) * 100) : 0,
      }
    })
    .filter((x) => x.attended > 0)

  const totalAttended = perLecture.reduce((s, x) => s + x.attended, 0)
  const totalHeld = perLecture.reduce((s, x) => s + x.lecture.held, 0)
  const avgRate = perLecture.length ? Math.round(perLecture.reduce((s, x) => s + x.rate, 0) / perLecture.length) : 0
  const tone = rateTone(avgRate)

  return (
    <Shell title="학생 상세">
      <Link href="/students" className="mb-5 inline-block text-[13px] text-text3 hover:text-text2">
        ← 학생 목록
      </Link>

      <div className="mb-7 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2 text-lg font-bold text-white">
          {student.name.charAt(0)}
        </div>
        <div>
          <div className="text-xl font-bold">{student.name}</div>
          <div className="mt-[3px] text-[13px] text-text3">
            {student.english_name} · {student.phone}
          </div>
        </div>
        {perLecture.length > 0 && (
          <div className="ml-auto">
            <span className={`rounded px-3.5 py-1.5 text-[13px] font-semibold ${RATE_TAG[tone]}`}>
              {tone === 'red' ? '⚠ 출석 위험' : tone === 'yellow' ? '출석 주의' : '출석 양호'}
            </span>
          </div>
        )}
      </div>

      <div className="mb-7 grid grid-cols-3 gap-4">
        <StatsCard label="이번달 평균 출석률" value={avgRate} unit="%" tone={tone} />
        <StatsCard label="이번달 출석 횟수" value={totalAttended} unit="회" sub={`총 ${totalHeld}회 중`} />
        <StatsCard label="출석 중인 강의 수" value={perLecture.length} unit="개" />
      </div>

      <div className="mb-3.5 text-sm font-bold uppercase tracking-wide text-text2">강의별 출석 현황</div>

      {perLecture.length === 0 ? (
        <div className="mb-6 rounded-xl border border-border bg-surface px-5 py-10 text-center text-[13px] text-text3">
          이번달 출석 기록이 없습니다
        </div>
      ) : (
        <div className="mb-6">
          {perLecture.map(({ lecture, attended, rate }) => (
            <div
              key={lecture.id}
              className="mb-2.5 flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4"
            >
              <div>
                <div className="text-sm font-semibold">{lecture.lecture_name}</div>
                <div className="mt-0.5 text-xs text-text3">
                  {lecture.days} · 이번달 {lecture.total}회 · 현재 {lecture.held}회 진행
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[22px] font-bold ${RATE_TEXT[rateTone(rate)]}`}>{rate}%</div>
                <div className="text-[11px] text-text3">
                  {attended} / {lecture.held}회 출석
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3.5 text-sm font-bold uppercase tracking-wide text-text2">전체 출석 기록</div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-10 text-center text-[13px] text-text3">
          출석 기록이 없습니다
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['날짜', '강의', '출석 시각'].map((h) => (
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
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="border-b border-border/50 px-4 py-3 text-[13px]">{formatDateKo(log.date)}</td>
                  <td className="border-b border-border/50 px-4 py-3 text-[13px]">{log.lecture_name}</td>
                  <td className="border-b border-border/50 px-4 py-3 text-[13px] text-text2">
                    {new Date(log.attended_at).toLocaleTimeString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
