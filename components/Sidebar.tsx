'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', icon: '📊', label: '대시보드' },
  { href: '/students', icon: '👥', label: '학생 관리' },
  { href: '/lectures', icon: '📚', label: '강의 설정' },
  { href: '/qr', icon: '🔲', label: 'QR 띄우기' },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r border-border bg-surface py-6">
      <div className="mb-4 flex items-center gap-2 border-b border-border px-5 pb-6">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent2 text-sm">
          📋
        </div>
        <div>
          <div className="text-sm font-bold">AttendAI</div>
          <div className="mt-px text-[10px] text-text3">출석 관리 시스템</div>
        </div>
      </div>

      <nav className="px-3">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-text3">메뉴</div>
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium ${
                active ? 'bg-accent/12 text-accent' : 'text-text2 hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-[15px]">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
