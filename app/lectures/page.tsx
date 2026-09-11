import LectureManager from '@/components/LectureManager'
import Shell from '@/components/Shell'
import { requireTeacher } from '@/lib/auth/session'
import { getLectures } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function LecturesPage() {
  const teacher = await requireTeacher()
  const lectures = await getLectures(teacher.id)

  return (
    <Shell teacherName={teacher.name} title="강의 설정" sub="강의를 추가하고 수업 요일을 선택하세요">
      <LectureManager initial={lectures} />
    </Shell>
  )
}
