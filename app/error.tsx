'use client'

/**
 * 서버 컴포넌트의 DB 조회가 실패해도 500 대신 이 화면이 뜬다.
 * 학생 화면(/attend)에도 적용되므로 기술적인 내용은 details 안에 숨긴다.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-7">
      <div className="w-full max-w-[440px] rounded-[20px] border border-border bg-surface px-6 py-8 text-center">
        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-yellow/12 text-[32px]">
          ⚠️
        </div>
        <div className="mb-2 text-[22px] font-bold">화면을 불러올 수 없습니다</div>
        <div className="mb-7 text-[13px] text-text3">잠시 후 다시 시도해 주세요</div>

        <button
          onClick={reset}
          className="w-full rounded-[10px] bg-accent py-3.5 text-[15px] font-bold text-white"
        >
          다시 시도
        </button>

        <details className="mt-5 text-left">
          <summary className="cursor-pointer text-[11px] text-text3">기술 정보</summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-surface2 px-3 py-2 text-[11px] leading-relaxed text-red">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  )
}
