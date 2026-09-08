import { NextResponse } from 'next/server'
import { getTodayAttendance } from '@/lib/queries'

export async function GET(req: Request) {
  const lectureId = new URL(req.url).searchParams.get('lecture_id')
  if (!lectureId) return NextResponse.json({ error: 'lecture_id 가 필요합니다' }, { status: 400 })

  try {
    return NextResponse.json(await getTodayAttendance(lectureId))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
