import 'server-only'

import { NextResponse } from 'next/server'
import { getTeacher, type Teacher } from './session'

/**
 * API Route 용 세션 확인.
 *
 * 페이지는 리다이렉트가 맞지만 API 는 401 JSON 을 줘야 한다 —
 * fetch 하는 쪽이 로그인 HTML 을 받으면 res.json() 이 터진다.
 *
 * 사용법: 반환값이 NextResponse 면 그대로 return 한다.
 *   const teacher = await requireTeacherApi()
 *   if (teacher instanceof NextResponse) return teacher
 */
export async function requireTeacherApi(): Promise<Teacher | NextResponse> {
  const teacher = await getTeacher()
  if (!teacher) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  return teacher
}
