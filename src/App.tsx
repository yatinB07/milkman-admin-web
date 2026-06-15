import {
  Bell,
  Bike,
  ClipboardList,
  Gauge,
  Package,
  Search,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from './lib/api'
import './App.css'

type HealthResponse = {
  data: {
    name: string
    status: string
    version: string
  }
}

const navItems = [
  { label: 'Dashboard', icon: Gauge, active: true },
  { label: 'Stores', icon: Store },
  { label: 'Products', icon: Package },
  { label: 'Orders', icon: ClipboardList },
  { label: 'Riders', icon: Bike },
  { label: 'Customers', icon: Users },
  { label: 'Settings', icon: ShieldCheck },
]

const metrics = [
  { label: 'Stores', value: '1', detail: 'Demo seed' },
  { label: 'Orders', value: '0', detail: 'Ready for workflow' },
  { label: 'Riders', value: '1', detail: 'Assigned to demo store' },
  { label: 'Customers', value: '1', detail: 'Demo profile' },
]

function App() {
  const health = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const response = await api.get<HealthResponse>('/api/v1/health')

      return response.data.data
    },
    retry: false,
  })

  return (
    <main className="admin-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-block">
          <div className="brand-mark">M</div>
          <div>
            <p className="brand-name">MilkMan</p>
            <p className="brand-subtitle">Admin</p>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={`nav-item ${item.active ? 'is-active' : ''}`}
              key={item.label}
              type="button"
            >
              <item.icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="search-box">
            <Search aria-hidden="true" size={18} />
            <input aria-label="Search" placeholder="Search stores, orders, customers" />
          </div>
          <button className="icon-button" type="button" aria-label="Notifications">
            <Bell aria-hidden="true" size={20} />
          </button>
        </header>

        <section className="page-heading">
          <div>
            <h1>Operations Dashboard</h1>
            <p>Fresh Laravel seed data, clean API contracts, and role-aware workflows.</p>
          </div>
          <div className={`api-status ${health.data?.status === 'ok' ? 'is-ok' : ''}`}>
            <span />
            {health.isLoading
              ? 'Checking API'
              : health.data?.status === 'ok'
                ? `${health.data.name} ${health.data.version}`
                : 'API offline'}
          </div>
        </section>

        <section className="metric-grid" aria-label="Dashboard metrics">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.detail}</span>
            </article>
          ))}
        </section>

        <section className="work-grid">
          <article className="panel">
            <div className="panel-heading">
              <h2>Next Backend Work</h2>
              <span>Phase 2</span>
            </div>
            <ul className="task-list">
              <li>Complete Laravel-style domain migrations.</li>
              <li>Add factories and seeders for catalog and order flows.</li>
              <li>Build Sanctum login endpoints for each identity type.</li>
              <li>Generate OpenAPI examples from request/resource classes.</li>
            </ul>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h2>Access Model</h2>
              <span>Sanctum</span>
            </div>
            <div className="role-list">
              {['super-admin', 'admin', 'store-owner', 'store-staff', 'rider', 'customer'].map(
                (role) => (
                  <span key={role}>{role}</span>
                ),
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default App
