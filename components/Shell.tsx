import Sidebar from './Sidebar'

/** 선생님용 페이지 공통 레이아웃 (사이드바 + 본문) */
export default function Shell({
  title,
  sub,
  action,
  children,
}: {
  title: string
  sub?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto px-8 py-7">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {sub && <div className="mt-0.5 text-[13px] text-text3">{sub}</div>}
          </div>
          {action}
        </div>
        {children}
      </main>
    </div>
  )
}
