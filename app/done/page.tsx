import { formatDateKo, todayKST } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DonePage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; lecture?: string; at?: string }>
}) {
  const { name, lecture, at } = await searchParams

  const attendedAt = at ? new Date(at) : null
  const time = attendedAt?.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  })
  const date = attendedAt
    ? formatDateKo(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(attendedAt))
    : formatDateKo(todayKST())

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-7">
      <div className="mb-8 text-[13px] text-text3">AttendAI</div>

      <div className="w-full max-w-[400px] rounded-[20px] border border-border bg-surface px-6 py-8 text-center">
        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green/12 text-[32px]">
          ✅
        </div>
        <div className="mb-2 text-[22px] font-bold">출석 완료!</div>
        <div className="mb-7 text-[13px] text-text3">출석이 정상적으로 기록되었습니다</div>

        <div className="mb-5 rounded-[10px] bg-surface2 p-4 text-left">
          {name && (
            <div className="mb-2 flex justify-between text-[13px]">
              <span className="text-text3">이름</span>
              <span className="font-semibold">{name}</span>
            </div>
          )}
          {lecture && (
            <div className="mb-2 flex justify-between text-[13px]">
              <span className="text-text3">강의</span>
              <span className="font-semibold">{lecture}</span>
            </div>
          )}
          <div className="mb-2 flex justify-between text-[13px]">
            <span className="text-text3">날짜</span>
            <span className="font-semibold">{date}</span>
          </div>
          {time && (
            <div className="flex justify-between text-[13px]">
              <span className="text-text3">시각</span>
              <span className="font-semibold">{time}</span>
            </div>
          )}
        </div>

        <div className="text-xs text-text3">이 창을 닫아도 됩니다</div>
      </div>
    </div>
  )
}
