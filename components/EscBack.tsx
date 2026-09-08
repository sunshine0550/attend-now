'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** ESC 키로 이전 페이지(QR 설정)로 돌아간다 */
export default function EscBack({ href }: { href: string }) {
  const router = useRouter()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.push(href)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, href])

  return null
}
