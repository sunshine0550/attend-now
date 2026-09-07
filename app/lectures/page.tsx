'use client'

import { useCallback, useEffect, useState } from 'react'
import Shell from '@/components/Shell'
import { lectureSessions, todayKST } from '@/lib/utils'
import type { LectureWithSessions } from '@/types'

const DAY_ORDER = ['월', '화', '수', '목', '금', '토', '일']

export default function LecturesPage() {
  const [lectures, setLectures] = useState<LectureWithSessions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/lectures')
    const json = await res.json()
    if (!res.ok) setError(json.error ?? '강의 목록을 불러오지 못했습니다')
    else setLectures(json)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // 요일 선택 순서와 무관하게 항상 월→일 순서로 저장
  const days = DAY_ORDER.filter((d) => selectedDays.includes(d)).join('')

  const preview =
    days && startDate && endDate
      ? lectureSessions({ days, start_date: startDate, end_date: endDate }, todayKST().slice(0, 7)).total
      : 0

  async function save() {
    setError('')
    setSaving(true)
    const res = await fetch('/api/lectures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lecture_name: name, days, start_date: startDate, end_date: endDate }),
    })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) return setError(json.error ?? '저장에 실패했습니다')
    reset()
    load()
  }

  function reset() {
    setName('')
    setSelectedDays([])
    setStartDate('')
    setEndDate('')
  }

  async function remove(id: string, lectureName: string) {
    if (!confirm(`"${lectureName}" 강의를 삭제할까요? (출석 기록은 남습니다)`)) return

    const res = await fetch(`/api/lectures/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json()
      return setError(json.error ?? '삭제에 실패했습니다')
    }
    load()
  }

  return (
    <Shell title="강의 설정" sub="강의를 추가하고 수업 요일을 지정하세요">
      {error && (
        <div className="mb-5 rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-[13px] text-red">{error}</div>
      )}

      <div className="mb-7">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text3">등록된 강의</div>

        {loading ? (
          <div className="text-[13px] text-text3">불러오는 중…</div>
        ) : lectures.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-[13px] text-text3">
            등록된 강의가 없습니다
          </div>
        ) : (
          lectures.map((l) => (
            <div
              key={l.id}
              className="mb-2 flex items-center justify-between rounded-[10px] border border-border bg-surface px-[18px] py-3.5"
            >
              <div>
                <div className="text-sm font-semibold">{l.lecture_name}</div>
                <div className="mt-0.5 text-xs text-text3">
                  {l.days} · {l.start_date.replaceAll('-', '.')} — {l.end_date.replaceAll('-', '.')} · 이번달 {l.total}회
                </div>
              </div>
              <button
                onClick={() => remove(l.id, l.lecture_name)}
                aria-label={`${l.lecture_name} 삭제`}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-border bg-surface2 text-[13px] text-text3 hover:text-red"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      <div className="rounded-[14px] border border-border bg-surface p-6">
        <div className="mb-5 text-sm font-bold">새 강의 추가</div>

        <div className="mb-5">
          <label htmlFor="lecture-name" className="mb-2 block text-xs font-semibold text-text2">
            강의 이름
          </label>
          <input
            id="lecture-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: D강의, 초급반, 심화반"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] outline-none focus:border-accent"
          />
        </div>

        <div className="mb-5">
          <span className="mb-2 block text-xs font-semibold text-text2">수업 요일</span>
          <div className="flex gap-2">
            {DAY_ORDER.map((d) => {
              const on = selectedDays.includes(d)
              return (
                <button
                  key={d}
                  aria-pressed={on}
                  onClick={() => setSelectedDays((prev) => (on ? prev.filter((x) => x !== d) : [...prev, d]))}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold ${
                    on ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface text-text2'
                  }`}
                >
                  {d}
                </button>
              )
            })}
          </div>
          <div className="mt-2 text-[11px] text-text3">
            선택한 요일 기준으로 이번달 수업일 자동 계산 →{' '}
            <strong className="text-accent">이번달 {preview}회</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="mb-5">
            <label htmlFor="start-date" className="mb-2 block text-xs font-semibold text-text2">
              시작일
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] outline-none focus:border-accent"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="end-date" className="mb-2 block text-xs font-semibold text-text2">
              종료일
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={reset}
            className="rounded-lg border border-border bg-surface2 px-4 py-2 text-[13px] font-semibold text-text2"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={saving || !name || !days || !startDate || !endDate}
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            {saving ? '저장 중…' : '강의 저장'}
          </button>
        </div>
      </div>
    </Shell>
  )
}
