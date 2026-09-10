'use client'

import { useState } from 'react'

export default function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
  inputMode,
}: {
  id: string
  label: string
  type?: 'text' | 'tel' | 'password'
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  hint?: string
  inputMode?: 'numeric' | 'text'
}) {
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-text2">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={`w-full rounded-[10px] border border-border bg-surface px-3.5 py-3 text-sm outline-none transition-colors focus:border-accent ${
            isPassword ? 'pr-12' : ''
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? '비밀번호 숨기기' : '비밀번호 표시'}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1.5 text-xs text-text3 hover:text-text2"
          >
            {reveal ? '숨기기' : '보기'}
          </button>
        )}
      </div>

      {hint && <div className="mt-1.5 text-[11px] text-text3">{hint}</div>}
    </div>
  )
}
