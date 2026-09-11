import { NextResponse } from 'next/server'
import { requireTeacherApi } from '@/lib/auth/api'
import { getStudentById } from '@/lib/queries'
import { supabase } from '@/lib/supabase'

/** 소프트 딜리트 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const { id } = await params

  // 내 강의 학생이 아니면 손댈 수 없다
  const student = await getStudentById(id, teacher.id)
  if (!student) return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 })

  const { data, error } = await supabase
    .from('students')
    .update({ deleted_at: new Date().toISOString(), deleted_by: teacher.id })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
