'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AuthField from '@/components/AuthField'
import AuthShell, { AuthSwitch } from '@/components/AuthShell'
import { formatPhone } from '@/lib/utils'

export default function SignupPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [invite, setInvite] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const phoneOk = /^010-\d{4}-\d{4}$/.test(phone)
  const passwordOk = password.length >= 8
  const matched = password.length > 0 && password === confirm
  const valid = name.trim().length > 0 && phoneOk && passwordOk && matched && invite.trim().length > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || busy) return

    setError('')
    setBusy(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, invite: invite.trim() }),
      })
      const json = await res.json()

      if (!res.ok) {
        setBusy(false)
        return setError(json.error ?? '회원가입에 실패했습니다')
      }

      router.replace('/')
      router.refresh()
    } catch {
      setBusy(false)
      setError('서버에 연결할 수 없습니다')
    }
  }

  return (
    <AuthShell
      title="회원가입"
      sub="초대 코드를 받은 선생님만 가입할 수 있습니다"
      footer={<AuthSwitch label="이미 계정이 있으신가요?" href="/login" action="로그인" />}
    >
      <form onSubmit={submit} noValidate>
        {error && (
          <div className="mb-4 rounded-[10px] border border-red/30 bg-red/10 px-4 py-3 text-[13px] text-red">
            {error}
          </div>
        )}

        <AuthField
          id="name"
          label="이름"
          autoComplete="name"
          value={name}
          onChange={setName}
          placeholder="예: 박수현"
        />

        <AuthField
          id="phone"
          label="전화번호"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          value={phone}
          onChange={(v) => setPhone(formatPhone(v))}
          placeholder="010-0000-0000"
          hint="로그인할 때 아이디로 사용됩니다"
        />

        <AuthField
          id="password"
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder="8자 이상"
          hint={password.length > 0 && !passwordOk ? '8자 이상 입력하세요' : undefined}
        />

        <AuthField
          id="confirm"
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          placeholder="••••••••"
          hint={confirm.length > 0 && !matched ? '비밀번호가 일치하지 않습니다' : undefined}
        />

        <AuthField
          id="invite"
          label="초대 코드"
          value={invite}
          onChange={setInvite}
          placeholder="관리자에게 받은 코드"
        />

        <button
          type="submit"
          disabled={!valid || busy}
          className="mt-2 w-full rounded-[10px] bg-accent py-3.5 text-[15px] font-bold text-white transition-opacity disabled:opacity-40"
        >
          {busy ? '가입 중…' : '회원가입'}
        </button>
      </form>
    </AuthShell>
  )
}
