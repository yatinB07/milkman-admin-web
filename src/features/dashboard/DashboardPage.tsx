import { Download, Filter, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { StatusPill } from '../../components/StatusPill'
import { DashboardBarChart, MetricCard } from '../../components/dashboard'
import { dashboardMetrics, orderTrend, payoutTrend, storeEarnings } from './dashboardData'
import { getApiHealth } from './dashboardRepository'

export function DashboardPage() {
  const health = useQuery({
    queryKey: ['api-health'],
    queryFn: getApiHealth,
    retry: false,
  })

  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Operational Overview</h2>
          <p>Real-time logistics and financial health tracking.</p>
        </div>

        <div className="toolbar-actions">
          <div className={`api-health ${health.data?.status === 'ok' ? 'is-online' : ''}`}>
            <span />
            {health.isLoading
              ? 'Checking API'
              : health.data?.status === 'ok'
                ? `${health.data.name} ${health.data.version}`
                : 'API offline'}
          </div>
          <button className="secondary-button" type="button">
            <Filter aria-hidden="true" size={17} />
            Filters
          </button>
          <button className="primary-button is-compact" type="button">
            <Download aria-hidden="true" size={17} />
            Export CSV
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Operational metrics">
        {dashboardMetrics.map((metric) => (
          <MetricCard
            icon={metric.icon}
            key={metric.label}
            label={metric.label}
            tone={metric.tone}
            trend={metric.trend}
            value={metric.value}
          />
        ))}
      </section>

      <section className="dashboard-chart-grid" aria-label="Dashboard charts">
        <DashboardBarChart
          title="Order Trend"
          description="Dummy weekly order volume until analytics API is connected."
          points={orderTrend}
        />
        <DashboardBarChart
          title="Earning Trend"
          description="Dummy payout trend until finance API is connected."
          points={payoutTrend}
        />
      </section>

      <section className="data-panel" aria-labelledby="store-earning-heading">
        <div className="data-panel-header">
          <div>
            <h3 id="store-earning-heading">Store Earning Report</h3>
            <p>Showing 1 to 5 of 124 stores</p>
          </div>
          <label className="table-search">
            <span className="sr-only">Search store name</span>
            <input placeholder="Search store name..." type="search" />
          </label>
        </div>

        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Sale Count</th>
                <th>Total Amount</th>
                <th>Cash On Hand</th>
                <th>Delivery Charge</th>
                <th>Platform Earning</th>
                <th>Payout</th>
                <th>Remaining Amount</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {storeEarnings.map((store) => (
                <tr key={store.id}>
                  <td>
                    <div className="store-cell">
                      <span>{store.initials}</span>
                      <div>
                        <strong>{store.name}</strong>
                        <small>{store.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>{store.saleCount}</td>
                  <td className="is-strong">{store.totalAmount}</td>
                  <td>{store.cashOnHand}</td>
                  <td>{store.deliveryCharge}</td>
                  <td className="is-positive">{store.platformEarning}</td>
                  <td>{store.payout}</td>
                  <td className="is-warning">{store.remainingAmount}</td>
                  <td>
                    <span className="rating-cell">
                      {store.rating}
                      <Star aria-hidden="true" size={15} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span>Showing 1 to 5 of 124 stores</span>
          <div className="pagination-controls">
            <button type="button" aria-label="Previous page">
              {'<'}
            </button>
            <button className="is-active" type="button">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <span>...</span>
            <button type="button">25</button>
            <button type="button" aria-label="Next page">
              {'>'}
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-support-grid">
        <article className="support-card">
          <span className="support-icon">24</span>
          <div>
            <h3>Awaiting Prep</h3>
            <p>Average wait time: 14m</p>
          </div>
          <StatusPill tone="warning">Urgent Priority</StatusPill>
        </article>

        <article className="support-card">
          <span className="support-icon">94%</span>
          <div>
            <h3>Fleet Efficiency</h3>
            <p>42 active riders on route</p>
          </div>
          <StatusPill>Operational</StatusPill>
        </article>
      </section>
    </>
  )
}
