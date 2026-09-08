'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function StudentDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function remove() {
    if (!confirm(`"${name}" 학생을 삭제할까요? (출석 기록은 남습니다)`)) return

    setBusy(true)
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json()
      setBusy(false)
      return alert(json.error ?? '삭제에 실패했습니다')
    }
    router.refresh()
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      aria-label={`${name} 삭제`}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-border bg-surface2 text-[13px] text-text3 hover:text-red disabled:opacity-40"
    >
      🗑️
    </button>
  )
}
