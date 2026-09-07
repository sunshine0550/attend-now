import AttendForm from '@/components/AttendForm'
import { getLecture } from '@/lib/queries'
import { formatDateKo, todayKST } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AttendPage({ params }: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await params
  const lecture = await getLecture(lectureId)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-7">
      <div className="mb-8 text-[13px] text-text3">AttendAI</div>

      <div className="w-full max-w-[400px] rounded-[20px] border border-border bg-surface px-6 py-7 text-center">
        {!lecture ? (
          <div className="py-10 text-[13px] text-text3">
            강의를 찾을 수 없습니다.
            <br />
            선생님께 QR 코드를 다시 확인해 주세요.
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between rounded-[10px] border border-accent/20 bg-accent/10 px-4 py-3.5 text-left">
              <div>
                <div className="mb-[3px] text-[10px] font-semibold uppercase tracking-wider text-accent">출석 강의</div>
                <div className="text-lg font-extrabold">{lecture.lecture_name}</div>
                <div className="mt-0.5 text-[11px] text-text3">{formatDateKo(todayKST())}</div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base text-white">
                ✓
              </div>
            </div>

            <AttendForm lectureId={lecture.id} lectureName={lecture.lecture_name} />
          </>
        )}
      </div>
    </div>
  )
}
