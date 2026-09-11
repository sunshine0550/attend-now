'use client'

import { useState } from 'react'
import { INVITE_TTL_DAYS, type Invite } from '@/lib/invites-shared'

function statusOf(invite: Invite): { label: string; className: string } {
  if (invite.used_at) return { label: '사용됨', className: 'bg-surface2 text-text3' }
  if (new Date(invite.expires_at) < new Date()) return { label: '만료', className: 'bg-red/12 text-red' }
  return { label: '사용 가능', className: 'bg-green/12 text-green' }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function InviteManager({ initial }: { initial: Invite[] }) {
  const [invites, setInvites] = useState<Invite[]>(initial)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function issue() {
    setError('')
    setBusy(true)

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })
      const json = await res.json()
      setBusy(false)

      if (!res.ok) return setError(json.error ?? '초대 코드 발급에 실패했습니다')

      setInvites((prev) => [json, ...prev])
      setNote('')
    } catch {
      setBusy(false)
      setError('서버에 연결할 수 없습니다')
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500)
    } catch {
      setError('복사할 수 없습니다. 코드를 직접 선택해 복사하세요.')
    }
  }

  return (
    <div className="max-w-[520px] rounded-[14px] border border-border bg-surface p-4 sm:p-6">
      <div className="mb-1 text-sm font-bold">선생님 초대</div>
      <div className="mb-5 text-[11px] leading-relaxed text-text3">
        코드 하나로 한 명만 가입할 수 있고 {INVITE_TTL_DAYS}일 후 만료됩니다. 새 선생님에게 코드를 전달하세요.
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] border border-red/30 bg-red/10 px-4 py-3 text-[13px] text-red">{error}</div>
      )}

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="메모 (예: 김선생님용)"
          className="min-w-0 flex-1 rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-[13px] outline-none focus:border-accent"
        />
        <button
          onClick={issue}
          disabled={busy}
          className="shrink-0 rounded-[10px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          {busy ? '발급 중…' : '초대 코드 발급'}
        </button>
      </div>

      {invites.length === 0 ? (
        <div className="rounded-[10px] bg-surface2 px-4 py-6 text-center text-[13px] text-text3">
          발급한 초대 코드가 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => {
            const status = statusOf(invite)
            const usable = !invite.used_at && new Date(invite.expires_at) >= new Date()

            return (
              <div key={invite.code} className="rounded-[10px] bg-surface2 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <code className={`font-mono text-[13px] font-semibold ${usable ? '' : 'text-text3 line-through'}`}>
                    {invite.code}
                  </code>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                    {usable && (
                      <button
                        onClick={() => copy(invite.code)}
                        className="rounded-md border border-border px-2 py-1 text-[11px] text-text3 hover:text-accent"
                      >
                        {copied === invite.code ? '복사됨' : '복사'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-1 text-[11px] text-text3">
                  {invite.note && `${invite.note} · `}
                  {invite.used_at ? `${formatDate(invite.used_at)} 사용` : `${formatDate(invite.expires_at)} 만료`}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
