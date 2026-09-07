import Link from 'next/link'
import LectureTabs from '@/components/LectureTabs'
import LivePanel from '@/components/LivePanel'
import QRCode from '@/components/QRCode'
import Shell from '@/components/Shell'
import { getLectureAttendance, getLectures } from '@/lib/queries'
import { formatDateKo, todayKST } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function QRPage({ searchParams }: { searchParams: Promise<{ lecture_id?: string }> }) {
  const { lecture_id } = await searchParams
  const month = todayKST().slice(0, 7)
  const lectures = await getLectures(month)

  if (lectures.length === 0) {
    return (
      <Shell title="QR 출석 코드" sub="등록된 강의가 없습니다">
        <div className="rounded-xl border border-border bg-surface px-5 py-12 text-center text-[13px] text-text3">
          먼저 <span className="text-accent">강의 설정</span>에서 강의를 추가하세요
        </div>
      </Shell>
    )
  }

  const selected = lectures.find((l) => l.id === lecture_id) ?? lectures[0]
  const rows = await getLectureAttendance(selected.id, month)

  return (
    <Shell title="QR 출석 코드" sub="수업 시작 시 학생들에게 보여주세요">
      <LectureTabs lectures={lectures} selectedId={selected.id} basePath="/qr" />

      <div className="flex flex-wrap items-start gap-7">
        <div className="shrink-0">
          <QRCode lectureId={selected.id} size={200} />
          <Link
            href={`/qr/fullscreen?lecture_id=${selected.id}`}
            className="mt-3 block rounded-lg bg-accent px-4 py-2 text-center text-xs font-semibold text-white"
          >
            ⛶ 전체화면
          </Link>
        </div>

        <div className="min-w-[220px] flex-1">
          <div className="mb-4 rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text3">현재 수업 정보</div>
            <div className="mb-1 text-[22px] font-extrabold">{selected.lecture_name}</div>
            <div className="mb-4 text-[13px] text-text3">
              {selected.days} · 이번달 {selected.total}회 중 {selected.held}회 진행
            </div>
            <div className="text-xs text-text3">{formatDateKo(todayKST())}</div>
          </div>

          <LivePanel lectureId={selected.id} enrolled={rows.length} />
        </div>
      </div>
    </Shell>
  )
}
