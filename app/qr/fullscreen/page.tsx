import { notFound } from 'next/navigation'
import EscBack from '@/components/EscBack'
import LivePanel from '@/components/LivePanel'
import QRCode from '@/components/QRCode'
import { requireTeacher } from '@/lib/auth/session'
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
  const teacher = await requireTeacher()
  if (!lecture_id) notFound()

  const month = todayKST().slice(0, 7)
  const lecture = await getLecture(lecture_id, teacher.id)
  if (!lecture) notFound()

  const { rows } = await getLectureAttendance(lecture, month)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0a0a0a] p-6 lg:flex-row lg:gap-20 lg:p-10">
      <EscBack href={`/qr?lecture_id=${lecture.id}`} />

      <div className="w-full max-w-[420px] text-left text-white lg:w-auto">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">출석 체크</div>
        <div className="mb-2 text-[36px] font-extrabold leading-tight sm:text-[52px]">{lecture.lecture_name}</div>
        <div className="mb-6 text-sm text-neutral-500 sm:text-lg lg:mb-8">
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
