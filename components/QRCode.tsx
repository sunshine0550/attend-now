'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

/**
 * url 이 있으면 그대로 쓴다 (서버가 정한 배포 주소).
 * 없으면(로컬 개발) 현재 origin 을 쓴다 — 이때 브라우저를 localhost 로 열면
 * QR 에 localhost 가 박혀 휴대폰에서 접속할 수 없으니, dev 서버가 알려주는
 * Network 주소(http://192.168.x.x:3000)로 열어야 같은 와이파이에서 스캔된다.
 */
export default function QRCode({
  lectureId,
  url,
  size,
}: {
  lectureId: string
  url: string | null
  size: number
}) {
  const [fallback, setFallback] = useState('')

  useEffect(() => {
    if (!url) setFallback(`${window.location.origin}/attend/${lectureId}`)
  }, [url, lectureId])

  const value = url ?? fallback

  return (
    <div className="inline-block rounded-2xl bg-white p-6">
      {value ? (
        <QRCodeSVG value={value} size={size} level="M" />
      ) : (
        <div style={{ width: size, height: size }} />
      )}
      <div className="mt-3 max-w-[240px] break-all text-center font-mono text-[11px] text-neutral-500">
        {value.replace(/^https?:\/\//, '')}
      </div>
    </div>
  )
}
