import { NextResponse } from 'next/server'
import { supabase, TEACHER_ID } from '@/lib/supabase'

/** 소프트 딜리트 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabase
    .from('students')
    .update({ deleted_at: new Date().toISOString(), deleted_by: TEACHER_ID })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
