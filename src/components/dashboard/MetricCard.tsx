import type { LucideIcon } from 'lucide-react'

export type MetricCardTone = 'success' | 'warning' | 'danger'

type MetricCardProps = {
  label: string
  value: string
  trend: string
  icon: LucideIcon
  tone?: MetricCardTone
}

export function MetricCard({ label, value, trend, icon: Icon, tone = 'success' }: MetricCardProps) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div>
        <p>{label}</p>
        <Icon aria-hidden="true" size={21} />
      </div>
      <strong>{value}</strong>
      <span>{trend}</span>
    </article>
  )
}
