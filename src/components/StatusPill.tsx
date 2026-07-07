type StatusPillProps = {
  children: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}

export function StatusPill({ children, tone = 'success' }: StatusPillProps) {
  return <span className={`status-pill status-pill-${tone}`}>{children}</span>
}
