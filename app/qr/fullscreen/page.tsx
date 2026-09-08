import { notFound } from 'next/navigation'
import EscBack from '@/components/EscBack'
import LivePanel from '@/components/LivePanel'
import QRCode from '@/components/QRCode'
import { getLecture, getLectureAttendance } from '@/lib/queries'
import { attendUrl } from '@/lib/site-url'
import { formatDateKo, formatTimeRange, todayKST } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function FullscreenPage({
  searchParams,
}: {
  searchParams: Promise<{ lecture_id?: string }>
}) {
  const { lecture_id } = await searchParams
  if (!lecture_id) notFound()

  const month = todayKST().slice(0, 7)
  const lecture = await getLecture(lecture_id)
  if (!lecture) notFound()

  const { rows } = await getLectureAttendance(lecture.id, month)

  return (
    <div className="flex min-h-screen flex-wrap items-center justify-center gap-20 bg-[#0a0a0a] p-10">
      <EscBack href={`/qr?lecture_id=${lecture.id}`} />

      <div className="text-left text-white">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">출석 체크</div>
        <div className="mb-2 text-[52px] font-extrabold leading-tight">{lecture.lecture_name}</div>
        <div className="mb-8 text-lg text-neutral-500">
          {formatDateKo(todayKST())} · {lecture.days}
          {formatTimeRange(lecture.start_time, lecture.end_time) &&
            ` · ${formatTimeRange(lecture.start_time, lecture.end_time)}`}
        </div>

        <LivePanel lectureId={lecture.id} enrolled={rows.length} compact />

        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <div className="h-2 w-2 rounded-full bg-green" />
          QR 스캔 후 이름과 전화번호를 입력하세요
        </div>
        <div className="mt-4 text-xs text-neutral-700">ESC 키로 닫기</div>
      </div>

      <QRCode lectureId={lecture.id} url={attendUrl(lecture.id)} size={240} />
    </div>
  )
}
