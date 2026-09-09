import Link from "next/link";
import Shell from "@/components/Shell";
import StudentDeleteButton from "@/components/StudentDeleteButton";
import { getStudents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <Shell title="학생 관리" sub={`등록된 학생 ${students.length}명`}>
      {students.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-12 text-center text-[13px] text-text3">
          등록된 학생이 없습니다. 학생이 QR로 첫 출석을 하면 자동으로
          등록됩니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr>
                  {["이름", "영어 이름", "전화번호", ""].map((h, i) => (
                    <th
                      key={i}
                      className="border-b border-border bg-surface2 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="border-b border-border/50 px-4 py-3">
                      <Link
                        href={`/students/${s.id}`}
                        className="text-[13px] font-semibold hover:text-accent"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="border-b border-border/50 px-4 py-3 text-xs text-text2">
                      {s.english_name}
                    </td>
                    <td className="border-b border-border/50 px-4 py-3 text-xs text-text2">
                      {s.phone}
                    </td>
                    <td className="border-b border-border/50 px-4 py-3 text-right">
                      <StudentDeleteButton id={s.id} name={s.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
}
