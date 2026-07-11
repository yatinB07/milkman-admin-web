import type { AdminModule } from '../../routes/adminModules'

type AdminBreadcrumbProps = {
  activeModule: AdminModule
  activePath: string
  dashboardModule?: AdminModule
  onNavigate: (module: AdminModule) => void
}

export function AdminBreadcrumb({ activeModule, activePath, dashboardModule, onNavigate }: AdminBreadcrumbProps) {
  const isDashboard = activeModule.id === 'dashboard'
  const childLabel = getChildLabel(activeModule, activePath)

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
          <li aria-current={childLabel ? undefined : 'page'}>
            <span>{activeModule.label}</span>
          </li>
        ) : null}
        {childLabel ? (
          <li aria-current="page">
            <span>{childLabel}</span>
          </li>
        ) : null}
      </ol>
    </nav>
  )
}

function getChildLabel(activeModule: AdminModule, activePath: string) {
  if (activeModule.id === 'stores') {
    if (activePath === '/stores/create') return 'Add Store'
    if (activePath.startsWith('/stores/edit/')) return 'Edit Store'
  }

  if (activeModule.id === 'product-variants') {
    if (activePath === '/product-variants/create') return 'Add Product Variant'
    if (activePath.startsWith('/product-variants/edit/')) return 'Edit Product Variant'
  }

  if (activeModule.id === 'products') {
    if (activePath === '/products/create') return 'Add Product'
    if (activePath.startsWith('/products/edit/')) return 'Edit Product'
  }

  if (activeModule.id === 'zones') {
    if (activePath === '/zones/create') return 'Add Zone'
    if (activePath.startsWith('/zones/edit/')) return 'Edit Zone'
  }

  if (activeModule.id === 'store-categories') {
    if (activePath === '/store-categories/create') return 'Add Store Category'
    if (activePath.startsWith('/store-categories/edit/')) return 'Edit Store Category'
  }

  return null
}
