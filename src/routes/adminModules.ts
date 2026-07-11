import { lazy, type ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  Bike,
  CalendarDays,
  Gauge,
  LayoutDashboard,
  ListTree,
  MapPinned,
  Package,
  Shapes,
  ShoppingCart,
  Store,
  Users,
  Settings,
} from 'lucide-react'

export type AdminModule = {
  id: string
  path: string
  label: string
  icon: LucideIcon
  component: ComponentType
  permission?: string
  permissions?: {
    view?: string
    create?: string
    update?: string
    delete?: string
  }
  badge?: string
}

const CategoriesPage = lazy(() => import('../pages/CategoriesPage').then((module) => ({ default: module.CategoriesPage })))
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProductVariantsPage = lazy(() =>
  import('../pages/ProductVariantsPage').then((module) => ({ default: module.ProductVariantsPage })),
)
const ProductsPage = lazy(() => import('../pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const StoreCategoriesPage = lazy(() =>
  import('../pages/StoreCategoriesPage').then((module) => ({ default: module.StoreCategoriesPage })),
)
const StoresPage = lazy(() => import('../pages/StoresPage').then((module) => ({ default: module.StoresPage })))
const ZonesPage = lazy(() => import('../pages/ZonesPage').then((module) => ({ default: module.ZonesPage })))

const PlaceholderPage = DashboardPage
const productPermissions = crudPermissions('products.manage')
const storePermissions = crudPermissions('stores.manage')
const settingsPermissions = crudPermissions('settings.update')

export const adminModules: AdminModule[] = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard, component: DashboardPage },
  { id: 'reports', path: '/reports', label: 'Reports', icon: Gauge, component: PlaceholderPage, permission: 'reports.view' },
  { id: 'catalog', path: '/catalog', label: 'Catalog', icon: Package, component: PlaceholderPage, permission: 'products.manage' },
  {
    id: 'categories',
    path: '/categories',
    label: 'Categories',
    icon: Shapes,
    component: CategoriesPage,
    permission: productPermissions.view,
    permissions: productPermissions,
  },
  {
    id: 'store-categories',
    path: '/store-categories',
    label: 'Store Categories',
    icon: ListTree,
    component: StoreCategoriesPage,
    permission: productPermissions.view,
    permissions: productPermissions,
  },
  {
    id: 'products',
    path: '/products',
    label: 'Products',
    icon: Package,
    component: ProductsPage,
    permission: productPermissions.view,
    permissions: productPermissions,
  },
  {
    id: 'product-variants',
    path: '/product-variants',
    label: 'Product Variants',
    icon: Package,
    component: ProductVariantsPage,
    permission: productPermissions.view,
    permissions: productPermissions,
  },
  {
    id: 'stores',
    path: '/stores',
    label: 'Stores',
    icon: Store,
    component: StoresPage,
    permission: storePermissions.view,
    permissions: storePermissions,
  },
  {
    id: 'zones',
    path: '/zones',
    label: 'Zones',
    icon: MapPinned,
    component: ZonesPage,
    permission: settingsPermissions.view,
    permissions: settingsPermissions,
  },
  { id: 'riders', path: '/riders', label: 'Riders', icon: Bike, component: PlaceholderPage, permission: 'riders.manage' },
  { id: 'customers', path: '/customers', label: 'Customers', icon: Users, component: PlaceholderPage, permission: 'users.manage' },
  { id: 'orders', path: '/orders', label: 'Orders', icon: ShoppingCart, component: PlaceholderPage, permission: 'orders.view', badge: '18' },
  {
    id: 'subscriptions',
    path: '/subscriptions',
    label: 'Subscriptions',
    icon: CalendarDays,
    component: PlaceholderPage,
    permission: 'subscriptions.manage',
  },
  { id: 'payouts', path: '/payouts', label: 'Payouts', icon: Banknote, component: PlaceholderPage, permission: 'payouts.approve', badge: '12' },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings, component: PlaceholderPage, permission: 'settings.update' },
]

export function getModuleActionPermission(moduleId: string, action: keyof NonNullable<AdminModule['permissions']>) {
  const module = adminModules.find((item) => item.id === moduleId)

  return module?.permissions?.[action] ?? module?.permission
}

function crudPermissions(permission: string) {
  return {
    view: permission,
    create: permission,
    update: permission,
    delete: permission,
  }
}
