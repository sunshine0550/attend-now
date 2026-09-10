'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import AuthField from '@/components/AuthField'
import AuthShell, { AuthSwitch } from '@/components/AuthShell'
import { formatPhone } from '@/lib/utils'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next')

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const valid = /^010-\d{4}-\d{4}$/.test(phone) && password.length > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || busy) return

    setError('')
    setBusy(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setBusy(false)
        return setError(json.error ?? '로그인에 실패했습니다')
      }

      // 쿠키가 심어진 뒤 서버 컴포넌트를 새로 받아야 하므로 replace + refresh
      router.replace(next && next.startsWith('/') ? next : '/')
      router.refresh()
    } catch {
      setBusy(false)
      setError('서버에 연결할 수 없습니다')
    }
  }

  return (
    <AuthShell
      title="로그인"
      sub="선생님 계정으로 출석 현황을 관리하세요"
      footer={<AuthSwitch label="계정이 없으신가요?" href="/signup" action="회원가입" />}
    >
      <form onSubmit={submit} noValidate>
        {error && (
          <div className="mb-4 rounded-[10px] border border-red/30 bg-red/10 px-4 py-3 text-[13px] text-red">
            {error}
          </div>
        )}

        <AuthField
          id="phone"
          label="전화번호"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          value={phone}
          onChange={(v) => setPhone(formatPhone(v))}
          placeholder="010-0000-0000"
        />

        <AuthField
          id="password"
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={!valid || busy}
          className="mt-2 w-full rounded-[10px] bg-accent py-3.5 text-[15px] font-bold text-white transition-opacity disabled:opacity-40"
        >
          {busy ? '확인 중…' : '로그인'}
        </button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  // useSearchParams 는 Suspense 경계가 필요하다
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
