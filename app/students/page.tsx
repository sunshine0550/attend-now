import Shell from '@/components/Shell'
import StudentList from '@/components/StudentList'
import { requireTeacher } from '@/lib/auth/session'
import { getStudents } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const teacher = await requireTeacher()

  // 첫 10명은 서버에서 렌더해 내려준다 — 화면이 뜨자마자 목록이 보인다.
  // 이후 페이지는 클라이언트가 스크롤에 맞춰 이어 받는다.
  const first = await getStudents(teacher.id, { limit: 10 })

  return (
    <Shell teacherName={teacher.name} title="학생 관리" sub="이름 · 영어 이름 · 전화번호로 검색할 수 있습니다">
      <StudentList initial={first} />
    </Shell>
  )
}
