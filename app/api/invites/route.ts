import { NextResponse } from 'next/server'
import { requireTeacherApi } from '@/lib/auth/api'
import { createInvite, listInvites } from '@/lib/invites'

export async function GET() {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  try {
    return NextResponse.json(await listInvites(teacher.id))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const teacher = await requireTeacherApi()
  if (teacher instanceof NextResponse) return teacher

  const { note } = await req.json().catch(() => ({ note: undefined }))

  try {
    return NextResponse.json(await createInvite(teacher.id, note), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
