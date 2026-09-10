import Link from 'next/link'

/**
 * 로그인·회원가입 공통 껍데기.
 * 모바일은 카드 하나만, lg 이상에서는 왼쪽에 브랜드 패널이 붙는 2단 구성.
 */
export default function AuthShell({
  title,
  sub,
  footer,
  children,
}: {
  title: string
  sub: string
  footer: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* 브랜드 패널 — 좁은 화면에서는 상단 로고만 남긴다 */}
      <div className="relative flex shrink-0 items-center overflow-hidden bg-surface px-6 py-8 lg:w-[46%] lg:px-14 lg:py-0">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-0 h-[360px] w-[360px] rounded-full bg-accent2/20 blur-[120px]"
        />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2 text-lg">
              📋
            </div>
            <div>
              <div className="text-base font-bold">AttendAI</div>
              <div className="text-[11px] text-text3">출석 관리 시스템</div>
            </div>
          </div>

          <div className="mt-8 hidden lg:block">
            <h1 className="text-[34px] font-extrabold leading-[1.25] tracking-tight">
              QR 한 번으로
              <br />
              끝나는 출석 관리
            </h1>
            <p className="mt-4 max-w-[380px] text-sm leading-relaxed text-text2">
              학생은 QR을 스캔해 이름과 전화번호만 입력하고, 선생님은 강의별 출석률을 한눈에 봅니다.
            </p>

            <ul className="mt-8 space-y-3 text-[13px] text-text2">
              {[
                ['🔲', '수업 시작 시 QR을 띄우면 자동 집계'],
                ['📊', '강의별·월별 출석률과 전월 대비 증감'],
                ['👥', '전화번호 하나로 학생을 중복 없이 관리'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface2 text-xs">
                    {icon}
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 폼 */}
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <h2 className="text-[26px] font-bold tracking-tight sm:text-[28px]">{title}</h2>
          <p className="mt-1.5 text-[13px] text-text3">{sub}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-center text-[13px] text-text3">{footer}</div>
        </div>
      </div>
    </div>
  )
}

/** 로그인 ↔ 회원가입 전환 링크 */
export function AuthSwitch({ label, href, action }: { label: string; href: string; action: string }) {
  return (
    <>
      {label}{' '}
      <Link href={href} className="font-semibold text-accent hover:underline">
        {action}
      </Link>
    </>
  )
}
