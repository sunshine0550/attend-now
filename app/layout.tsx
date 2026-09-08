import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AttendAI — 출석 관리 시스템',
  description: 'QR 기반 강의 출석 관리',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard는 Google Fonts에 없어 공식 CDN을 사용 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
