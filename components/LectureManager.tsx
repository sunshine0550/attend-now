'use client'

import { useCallback, useState } from 'react'
import { formatTimeRange } from '@/lib/utils'
import type { Lecture } from '@/types'

/** 선생님 기준값. 달력이 아니라 "월화수목은 한 달 16번" 같은 고정 횟수다. */
const PRESETS = [
  { days: '월화수목', sessions: 16, label: '월 · 화 · 수 · 목' },
  { days: '토', sessions: 4, label: '토요일' },
  { days: '일', sessions: 4, label: '일요일' },
  { days: '토일', sessions: 8, label: '토 · 일' },
]

/**
 * 목록의 첫 렌더는 서버가 내려준 initial 을 그대로 쓴다.
 * 이전에는 마운트 후 /api/lectures 를 한 번 더 왕복해서 "불러오는 중…"이 보였다.
 */
export default function LectureManager({ initial }: { initial: Lecture[] }) {
  const [lectures, setLectures] = useState<Lecture[]>(initial)
  const [error, setError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [preset, setPreset] = useState<(typeof PRESETS)[number] | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [saving, setSaving] = useState(false)

  // 추가·수정·삭제 후에만 목록을 다시 받는다 (첫 렌더는 서버 데이터)
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/lectures')
      const json = await res.json()
      if (!res.ok) setError(json.error ?? '강의 목록을 불러오지 못했습니다')
      else setLectures(json)
    } catch {
      setError('서버 응답을 읽을 수 없습니다')
    }
  }, [])

  async function save() {
    if (!preset) return
    setError('')
    setSaving(true)

    const res = await fetch(editingId ? `/api/lectures/${editingId}` : '/api/lectures', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lecture_name: name,
        days: preset.days,
        sessions_per_month: preset.sessions,
        start_time: startTime,
        end_time: endTime,
      }),
    })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) return setError(json.error ?? '저장에 실패했습니다')
    reset()
    load()
  }

  function startEdit(lecture: Lecture) {
    setError('')
    setEditingId(lecture.id)
    setName(lecture.lecture_name)
    setPreset(PRESETS.find((p) => p.days === lecture.days) ?? null)
    // TIME 은 "10:00:00" 으로 오는데 input[type=time] 은 "10:00" 을 원한다
    setStartTime(lecture.start_time?.slice(0, 5) ?? '')
    setEndTime(lecture.end_time?.slice(0, 5) ?? '')
  }

  function reset() {
    setEditingId(null)
    setName('')
    setPreset(null)
    setStartTime('')
    setEndTime('')
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
    <>
      {error && (
        <div className="mb-5 rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-[13px] text-red">{error}</div>
      )}

      <div className="mb-7">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text3">등록된 강의</div>

        {lectures.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-[13px] text-text3">
            등록된 강의가 없습니다
          </div>
        ) : (
          lectures.map((l) => (
            <div
              key={l.id}
              className="mb-2 flex items-center justify-between gap-3 rounded-[10px] border border-border bg-surface px-4 py-3.5 sm:px-[18px]"
            >
              <div>
                <div className="text-sm font-semibold">{l.lecture_name}</div>
                <div className="mt-0.5 text-xs text-text3">
                  {l.days}
                  {formatTimeRange(l.start_time, l.end_time) && ` · ${formatTimeRange(l.start_time, l.end_time)}`} ·
                  한 달 {l.sessions_per_month}회 기준
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(l)}
                  aria-label={`${l.lecture_name} 수정`}
                  className={`flex h-[30px] w-[30px] items-center justify-center rounded-md border bg-surface2 text-[13px] ${
                    editingId === l.id ? 'border-accent text-accent' : 'border-border text-text3 hover:text-accent'
                  }`}
                >
                  ✏️
                </button>
                <button
                  onClick={() => remove(l.id, l.lecture_name)}
                  aria-label={`${l.lecture_name} 삭제`}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-border bg-surface2 text-[13px] text-text3 hover:text-red"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="rounded-[14px] border border-border bg-surface p-4 sm:p-6">
        <div className="mb-5 text-sm font-bold">{editingId ? '강의 수정' : '새 강의 추가'}</div>

        <div className="mb-5">
          <label htmlFor="lecture-name" className="mb-2 block text-xs font-semibold text-text2">
            강의 이름
          </label>
          <input
            id="lecture-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: Fluency Speaking, 초급반"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] outline-none focus:border-accent"
          />
        </div>

        <div className="mb-5">
          <span className="mb-2 block text-xs font-semibold text-text2">수업 요일</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const on = preset?.days === p.days
              return (
                <button
                  key={p.days}
                  aria-pressed={on}
                  onClick={() => setPreset(p)}
                  className={`rounded-lg border px-4 py-2.5 text-left text-[13px] font-semibold ${
                    on ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface text-text2'
                  }`}
                >
                  {p.label}
                  <span className="ml-2 text-[11px] font-medium text-text3">한 달 {p.sessions}회</span>
                </button>
              )
            })}
          </div>
          <div className="mt-2 text-[11px] text-text3">
            선택한 횟수가 출석률의 기준이 됩니다. 달력 날짜를 세지 않으므로 매달 동일합니다.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <div className="mb-5">
            <label htmlFor="start-time" className="mb-2 block text-xs font-semibold text-text2">
              수업 시작 시각 <span className="font-normal text-text3">(선택)</span>
            </label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] outline-none focus:border-accent"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="end-time" className="mb-2 block text-xs font-semibold text-text2">
              수업 종료 시각 <span className="font-normal text-text3">(선택)</span>
            </label>
            <input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
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
            disabled={saving || !name || !preset}
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            {saving ? '저장 중…' : editingId ? '수정 저장' : '강의 저장'}
          </button>
        </div>
      </div>
    </>
  )
}
