import {
  LogOut,
  Menu,
  Moon,
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
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onToggleTheme: () => void
  user: AdminUser | null
  navigationItems: AdminModule[]
  profileModule?: AdminModule
}

export function AdminShell({
  children,
  onLogout,
  activeModuleId,
  onNavigate,
  theme,
  sidebarCollapsed,
  onToggleSidebar,
  onToggleTheme,
  user,
  navigationItems,
  profileModule,
}: AdminShellProps) {
  const displayName = user?.name ?? 'Admin Profile'
  const displayRole = user?.roles[0]?.replace('-', ' ') ?? 'Admin'

  return (
    <main className={`admin-layout ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`} data-theme={theme}>
      <aside className="admin-sidebar" aria-label="Primary navigation">
        <div className="sidebar-brand">
          <h1>{sidebarCollapsed ? 'MM' : 'MilkMan Admin'}</h1>
          {!sidebarCollapsed ? <p>Operational Suite</p> : null}
        </div>

        <button
          className="sidebar-collapse"
          type="button"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebar}
        >
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

        <div className="sidebar-footer">
          {profileModule ? (
            <button
              className={`sidebar-profile ${activeModuleId === profileModule.id ? 'is-active' : ''}`}
              type="button"
              onClick={() => onNavigate(profileModule)}
            >
              <span className="avatar is-small">
                <UserRound aria-hidden="true" size={18} />
              </span>
              {!sidebarCollapsed ? (
                <span>
                  {displayName}
                  <small>{displayRole}</small>
                </span>
              ) : null}
            </button>
          ) : null}
          <button className="sidebar-logout" type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" size={19} />
            {!sidebarCollapsed ? <span>Logout</span> : null}
          </button>
        </div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div className="topbar-actions">
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
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </section>
    </main>
  )
}
