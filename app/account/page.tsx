import PasswordChangeForm from '@/components/PasswordChangeForm'
import Shell from '@/components/Shell'
import { requireTeacher } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const teacher = await requireTeacher()

  return (
    <Shell teacherName={teacher.name} title="계정 설정" sub="로그인 정보를 관리합니다">
      <div className="mb-5 max-w-[420px] rounded-[14px] border border-border bg-surface p-4 sm:p-6">
        <div className="mb-4 text-sm font-bold">내 정보</div>

        <dl className="space-y-3 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-text3">이름</dt>
            <dd className="font-semibold">{teacher.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text3">아이디</dt>
            <dd className="font-mono font-semibold">{teacher.login_id}</dd>
          </div>
        </dl>

        <div className="mt-4 text-[11px] text-text3">아이디는 변경할 수 없습니다.</div>
      </div>

      <PasswordChangeForm />
    </Shell>
  )
}
