import type { AdminModule } from '../../routes/adminModules'

type AdminBreadcrumbProps = {
  activeModule: AdminModule
  dashboardModule?: AdminModule
  onNavigate: (module: AdminModule) => void
}

export function AdminBreadcrumb({ activeModule, dashboardModule, onNavigate }: AdminBreadcrumbProps) {
  const isDashboard = activeModule.id === 'dashboard'

  return (
    <nav className="admin-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li>
          {dashboardModule && !isDashboard ? (
            <button type="button" onClick={() => onNavigate(dashboardModule)}>
              Dashboard
            </button>
          ) : (
            <span>Dashboard</span>
          )}
        </li>
        {!isDashboard ? (
          <li aria-current="page">
            <span>{activeModule.label}</span>
          </li>
        ) : null}
      </ol>
    </nav>
  )
}
