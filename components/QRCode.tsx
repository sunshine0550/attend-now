'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

/** 출석 URL은 배포 도메인에 따라 달라지므로 브라우저에서 origin을 읽는다 */
export default function QRCode({ lectureId, size }: { lectureId: string; size: number }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}/attend/${lectureId}`)
  }, [lectureId])

  return (
    <div className="inline-block rounded-2xl bg-white p-6">
      {url ? (
        <QRCodeSVG value={url} size={size} level="M" />
      ) : (
        <div style={{ width: size, height: size }} />
      )}
      <div className="mt-3 text-center font-mono text-[11px] text-neutral-500">
        {url.replace(/^https?:\/\//, '')}
      </div>
    </div>
  )
}
