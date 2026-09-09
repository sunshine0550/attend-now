export default function StatsCard({
  label,
  value,
  unit,
  sub,
  trend,
  tone,
}: {
  label: string
  value: number | string
  unit?: string
  sub?: string
  /** sub 를 증감으로 표시. up=초록, down=빨강, flat=회색 */
  trend?: 'up' | 'down' | 'flat'
  tone?: 'green' | 'yellow' | 'red'
}) {
  const toneClass = tone ? { green: 'text-green', yellow: 'text-yellow', red: 'text-red' }[tone] : ''
  const subClass = trend ? { up: 'text-green', down: 'text-red', flat: 'text-text3' }[trend] : 'text-text3'

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4 sm:px-5 sm:py-[18px]">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-text3 sm:text-[11px]">{label}</div>
      <div className={`mb-1 text-[22px] font-bold leading-none sm:text-[26px] ${toneClass}`}>
        {value}
        {unit && <span className="text-sm font-medium text-text3">{unit}</span>}
      </div>
      {sub && <div className={`text-[11px] font-medium ${subClass}`}>{sub}</div>}
    </div>
  )
}
