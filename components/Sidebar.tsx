'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/', icon: '📊', label: '대시보드' },
  { href: '/students', icon: '👥', label: '학생 관리' },
  { href: '/lectures', icon: '📚', label: '강의 설정' },
  { href: '/qr', icon: '🔲', label: 'QR 띄우기' },
]

export default function Sidebar({
  teacherName,
  onNavigate,
}: {
  teacherName: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function logout() {
    setSigningOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

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

      <div className="mt-auto border-t border-border px-3 pt-4">
        <div className="mb-2 flex items-center gap-2.5 px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-xs font-bold">
            {teacherName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{teacherName}</div>
            <div className="text-[10px] text-text3">선생님</div>
          </div>
        </div>

        <Link
          href="/account"
          onClick={onNavigate}
          className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium ${
            pathname.startsWith('/account') ? 'bg-accent/12 text-accent' : 'text-text2 hover:bg-white/[0.03]'
          }`}
        >
          <span className="text-[15px]">⚙️</span>
          계정 설정
        </Link>

        <button
          onClick={logout}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-text3 hover:bg-white/[0.03] hover:text-red disabled:opacity-40"
        >
          <span className="text-[15px]">🚪</span>
          {signingOut ? '로그아웃 중…' : '로그아웃'}
        </button>
      </div>
    </div>
  )
}
