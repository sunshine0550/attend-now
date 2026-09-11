'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import StudentDeleteButton from './StudentDeleteButton'
import type { StudentPage } from '@/lib/queries'
import type { Student } from '@/types'

const PAGE_SIZE = 10

export default function StudentList({ initial }: { initial: StudentPage }) {
  const [students, setStudents] = useState<Student[]>(initial.students)
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sentinel = useRef<HTMLDivElement>(null)
  // 응답이 뒤늦게 도착해 이전 검색어 결과가 덮어쓰는 것을 막는다
  const requestId = useRef(0)

  const fetchPage = useCallback(async (term: string, from: string | null, append: boolean) => {
    const id = ++requestId.current
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
      if (term.trim()) params.set('q', term.trim())
      if (from) params.set('cursor', from)

      const res = await fetch(`/api/students?${params}`)
      const json = await res.json()
      if (id !== requestId.current) return // 더 최신 요청이 있으면 버린다

      if (!res.ok) {
        setError(json.error ?? '학생 목록을 불러오지 못했습니다')
        return
      }

      setStudents((prev) => (append ? [...prev, ...json.students] : json.students))
      setCursor(json.nextCursor)
    } catch {
      if (id === requestId.current) setError('서버 응답을 읽을 수 없습니다')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  // 검색어 디바운스 (타이핑마다 요청하지 않게)
  useEffect(() => {
    if (q === '') {
      // 검색을 비우면 서버가 미리 내려준 첫 페이지로 되돌린다
      setStudents(initial.students)
      setCursor(initial.nextCursor)
      requestId.current++
      return
    }

    const timer = setTimeout(() => fetchPage(q, null, false), 300)
    return () => clearTimeout(timer)
  }, [q, fetchPage, initial])

  // 바닥에 닿으면 다음 페이지
  useEffect(() => {
    const node = sentinel.current
    if (!node || !cursor || loading) return

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchPage(q, cursor, true)
      },
      { rootMargin: '200px' },
    )

    io.observe(node)
    return () => io.disconnect()
  }, [cursor, loading, q, fetchPage])

  return (
    <>
      <div className="relative mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름, 영어 이름, 전화번호 검색"
          className="w-full rounded-[10px] border border-border bg-surface py-3 pl-10 pr-3.5 text-sm outline-none focus:border-accent"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text3">🔍</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-[13px] text-red">{error}</div>
      )}

      {students.length === 0 && !loading ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-12 text-center text-[13px] text-text3">
          {q ? `"${q}" 검색 결과가 없습니다` : '아직 출석한 학생이 없습니다. 학생이 QR로 출석하면 자동으로 등록됩니다.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr>
                  {['이름', '영어 이름', '전화번호', ''].map((h, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap border-b border-border bg-surface2 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="border-b border-border/50 px-4 py-3">
                      <Link href={`/students/${s.id}`} className="text-[13px] font-semibold hover:text-accent">
                        {s.name}
                      </Link>
                    </td>
                    <td className="border-b border-border/50 px-4 py-3 text-xs text-text2">{s.english_name}</td>
                    <td className="whitespace-nowrap border-b border-border/50 px-4 py-3 text-xs text-text2">
                      {s.phone}
                    </td>
                    <td className="border-b border-border/50 px-4 py-3 text-right">
                      <StudentDeleteButton
                        id={s.id}
                        name={s.name}
                        onDeleted={() => setStudents((prev) => prev.filter((x) => x.id !== s.id))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div ref={sentinel} className="py-4 text-center text-xs text-text3">
        {loading ? '불러오는 중…' : cursor ? '스크롤하면 더 불러옵니다' : students.length > 0 ? '마지막입니다' : ''}
      </div>
    </>
  )
}
