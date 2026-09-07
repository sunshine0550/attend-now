export default function StatsCard({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string
  value: number | string
  unit?: string
  sub?: string
  tone?: 'green' | 'yellow' | 'red'
}) {
  const toneClass = tone ? { green: 'text-green', yellow: 'text-yellow', red: 'text-red' }[tone] : ''

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-[18px]">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text3">{label}</div>
      <div className={`mb-1 text-[26px] font-bold leading-none ${toneClass}`}>
        {value}
        {unit && <span className="text-sm font-medium text-text3">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] font-medium text-text3">{sub}</div>}
    </div>
  )
}
