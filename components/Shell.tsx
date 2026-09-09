'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'

/**
 * 선생님용 페이지 공통 레이아웃.
 *
 * lg 이상: 사이드바 고정 노출.
 * lg 미만: 화면을 다 잡아먹지 않게 서랍(off-canvas)으로 숨기고 햄버거로 여닫는다.
 */
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
  const [open, setOpen] = useState(false)

  // 서랍이 열려 있는 동안 뒤 본문이 스크롤되지 않게 하고, ESC 로 닫는다
  useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:flex lg:min-h-screen">
      {/* 데스크톱 고정 사이드바 */}
      <aside className="hidden w-[220px] shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* 모바일·태블릿 서랍 */}
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
        <button
          aria-label="메뉴 닫기"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          className={`absolute inset-y-0 left-0 w-[260px] max-w-[80%] transition-transform duration-200 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mb-6 flex items-start gap-3 lg:mb-7">
          <button
            aria-label="메뉴 열기"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text2 lg:hidden"
          >
            ☰
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold sm:text-xl">{title}</h2>
            {sub && <div className="mt-0.5 text-xs text-text3 sm:text-[13px]">{sub}</div>}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>

        {children}
      </main>
    </div>
  )
}
