'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatPhone } from '@/lib/utils'

export default function AttendForm({ lectureId, lectureName }: { lectureId: string; lectureName: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [englishName, setEnglishName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const valid = name.trim() && englishName.trim() && /^010-\d{4}-\d{4}$/.test(phone)

  async function submit() {
    setMessage('')
    setSubmitting(true)

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_phone: phone,
        student_name: name.trim(),
        student_english_name: englishName.trim(),
        lecture_id: lectureId,
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setSubmitting(false)
      return setMessage(json.error ?? '출석 제출에 실패했습니다')
    }
    if (json.already) {
      setSubmitting(false)
      return setMessage('오늘 이미 출석했습니다')
    }

    const params = new URLSearchParams({
      name: json.student_name,
      lecture: lectureName,
      at: json.attended_at,
    })
    router.push(`/done?${params}`)
  }

  return (
    <>
      <div className="mb-4 text-left">
        <label htmlFor="name" className="mb-1.5 block text-[11px] font-semibold text-text3">
          이름
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          className="w-full rounded-[10px] border border-border bg-surface2 px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="mb-4 text-left">
        <label htmlFor="english-name" className="mb-1.5 block text-[11px] font-semibold text-text3">
          영어 이름
        </label>
        <input
          id="english-name"
          value={englishName}
          onChange={(e) => setEnglishName(e.target.value)}
          placeholder="Hong Gildong"
          className="w-full rounded-[10px] border border-border bg-surface2 px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="mb-4 text-left">
        <label htmlFor="phone" className="mb-1.5 block text-[11px] font-semibold text-text3">
          전화번호
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-0000-0000"
          className="w-full rounded-[10px] border border-border bg-surface2 px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      <button
        onClick={submit}
        disabled={!valid || submitting}
        className="mt-2 w-full rounded-[10px] bg-accent py-3.5 text-[15px] font-bold text-white disabled:opacity-40"
      >
        {submitting ? '제출 중…' : '출석 완료'}
      </button>

      {message ? (
        <div className="mt-4 text-[13px] font-semibold text-yellow">{message}</div>
      ) : (
        <div className="mt-4 text-[11px] text-text3">제출 후 수정이 불가합니다</div>
      )}
    </>
  )
}
