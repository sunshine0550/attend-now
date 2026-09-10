'use client'

import { useState } from 'react'
import AuthField from './AuthField'
import { MIN_PASSWORD, passwordError } from '@/lib/auth/validate'

export default function PasswordChangeForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const matched = next.length > 0 && next === confirm
  const valid = current.length > 0 && !passwordError(next) && matched

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || busy) return

    setError('')
    setDone(false)
    setBusy(true)

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      })
      const json = await res.json()
      setBusy(false)

      if (!res.ok) return setError(json.error ?? '비밀번호 변경에 실패했습니다')

      setCurrent('')
      setNext('')
      setConfirm('')
      setDone(true)
    } catch {
      setBusy(false)
      setError('서버에 연결할 수 없습니다')
    }
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-[420px] rounded-[14px] border border-border bg-surface p-4 sm:p-6">
      <div className="mb-1 text-sm font-bold">비밀번호 변경</div>
      <div className="mb-5 text-[11px] text-text3">
        변경하면 다른 기기에 남아 있던 로그인은 모두 해제됩니다.
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] border border-red/30 bg-red/10 px-4 py-3 text-[13px] text-red">{error}</div>
      )}
      {done && (
        <div className="mb-4 rounded-[10px] border border-green/30 bg-green/10 px-4 py-3 text-[13px] text-green">
          비밀번호가 변경되었습니다
        </div>
      )}

      <AuthField
        id="current-password"
        label="현재 비밀번호"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={setCurrent}
        placeholder="••••••••"
      />

      <AuthField
        id="new-password"
        label="새 비밀번호"
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={setNext}
        placeholder={`${MIN_PASSWORD}자 이상`}
        hint={next.length > 0 ? (passwordError(next) ?? undefined) : undefined}
      />

      <AuthField
        id="confirm-password"
        label="새 비밀번호 확인"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        placeholder="••••••••"
        hint={confirm.length > 0 && !matched ? '비밀번호가 일치하지 않습니다' : undefined}
      />

      <button
        type="submit"
        disabled={!valid || busy}
        className="mt-2 w-full rounded-[10px] bg-accent py-3 text-sm font-bold text-white disabled:opacity-40"
      >
        {busy ? '변경 중…' : '비밀번호 변경'}
      </button>
    </form>
  )
}
