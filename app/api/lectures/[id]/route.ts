import { NextResponse } from 'next/server'
import { requireTeacherApi } from '@/lib/auth/api'
import { getLecture } from '@/lib/queries'
import { supabase } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const { id } = await params

  try {
    const lecture = await getLecture(id, teacher.id)
    if (!lecture) return NextResponse.json({ error: '강의를 찾을 수 없습니다' }, { status: 404 })
    return NextResponse.json(lecture)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const { id } = await params
  const { lecture_name, days, sessions_per_month, start_time, end_time, active } = await req.json()

  const { data, error } = await supabase
    .from('lectures')
    .update({
      lecture_name,
      days,
      sessions_per_month,
      start_time: start_time || null,
      end_time: end_time || null,
      active,
      updated_by: teacher.id,
    })
    .eq('id', id)
    .eq('teacher_id', teacher.id) // 남의 강의는 수정할 수 없다
    .is('deleted_at', null)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '강의를 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json(data)
}

/** 소프트 딜리트 — row를 지우지 않고 deleted_at / deleted_by 만 채운다 */
export async function DELETE(_req: Request, { params }: Ctx) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const { id } = await params

  const { data, error } = await supabase
    .from('lectures')
    .update({ deleted_at: new Date().toISOString(), deleted_by: teacher.id })
    .eq('id', id)
    .eq('teacher_id', teacher.id)
    .is('deleted_at', null)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '강의를 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
