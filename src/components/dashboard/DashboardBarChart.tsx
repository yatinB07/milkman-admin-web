export type DashboardChartPoint = {
  label: string
  value: number
}

type DashboardBarChartProps = {
  title: string
  description: string
  points: DashboardChartPoint[]
}

export function DashboardBarChart({ title, description, points }: DashboardBarChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 1)

  return (
    <article className="dashboard-chart">
      <div className="dashboard-chart-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="dashboard-chart-bars">
        {points.map((point) => (
          <div className="dashboard-chart-bar" key={point.label}>
            <span style={{ height: `${Math.max((point.value / maxValue) * 100, 8)}%` }} />
            <small>{point.label}</small>
          </div>
        ))}
      </div>
    </article>
  )
}
