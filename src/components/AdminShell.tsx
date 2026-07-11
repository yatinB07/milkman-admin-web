import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Radio,
  Search,
  Sun,
  UserRound,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { AdminUser } from '../store/adminStore'
import type { AdminModule } from '../routes/adminModules'

type AdminShellProps = {
  children: ReactNode
  onLogout: () => void
  activeModuleId: string
  onNavigate: (module: AdminModule) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  user: AdminUser | null
  navigationItems: AdminModule[]
}

export function AdminShell({
  children,
  onLogout,
  activeModuleId,
  onNavigate,
  theme,
  onToggleTheme,
  user,
  navigationItems,
}: AdminShellProps) {
  const displayName = user?.name ?? 'Admin Profile'
  const displayRole = user?.roles[0]?.replace('-', ' ') ?? 'Admin'

  return (
    <main className="admin-layout" data-theme={theme}>
      <aside className="admin-sidebar" aria-label="Primary navigation">
        <div className="sidebar-brand">
          <h1>MilkMan Admin</h1>
          <p>Operational Suite</p>
        </div>

        <button className="sidebar-collapse" type="button" aria-label="Collapse sidebar">
          <Menu aria-hidden="true" size={18} />
        </button>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              className={`sidebar-link ${activeModuleId === item.id ? 'is-active' : ''}`}
              key={item.id}
              onClick={() => onNavigate(item)}
              type="button"
            >
              <item.icon aria-hidden="true" size={21} />
              <span>{item.label}</span>
              {item.badge ? <strong>{item.badge}</strong> : null}
            </button>
          ))}
        </nav>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div className="global-search">
            <Search aria-hidden="true" size={22} />
            <input aria-label="Global search" placeholder="Search orders, riders, stores..." />
          </div>

          <div className="topbar-actions">
            <button className="icon-action" type="button" aria-label="Live operations feed">
              <Radio aria-hidden="true" size={20} />
            </button>
            <button
              className="icon-action"
              type="button"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={onToggleTheme}
            >
              {theme === 'dark' ? (
                <Sun aria-hidden="true" size={20} />
              ) : (
                <Moon aria-hidden="true" size={20} />
              )}
            </button>
            <button className="icon-action has-dot" type="button" aria-label="Notifications">
              <Bell aria-hidden="true" size={20} />
            </button>
            <div className="topbar-divider" />
            <button className="profile-menu" type="button">
              <span className="avatar is-small">
                <UserRound aria-hidden="true" size={18} />
              </span>
              <span>
                {displayName}
                <small>{displayRole}</small>
              </span>
              <ChevronDown aria-hidden="true" size={16} />
            </button>
            <button className="icon-action" type="button" aria-label="Sign out" onClick={onLogout}>
              <LogOut aria-hidden="true" size={20} />
            </button>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </section>
    </main>
  )
}
