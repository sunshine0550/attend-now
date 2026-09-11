import { NextResponse } from 'next/server'
import { requireTeacherApi } from '@/lib/auth/api'
import { getLecture, getTodayAttendance } from '@/lib/queries'

export async function GET(req: Request) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const lectureId = new URL(req.url).searchParams.get('lecture_id')
  if (!lectureId) return NextResponse.json({ error: 'lecture_id 가 필요합니다' }, { status: 400 })

  try {
    // 남의 강의 실시간 현황을 볼 수 없게 소유 확인
    const lecture = await getLecture(lectureId, teacher.id)
    if (!lecture) return NextResponse.json({ error: '강의를 찾을 수 없습니다' }, { status: 404 })

    return NextResponse.json(await getTodayAttendance(lecture.id))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
