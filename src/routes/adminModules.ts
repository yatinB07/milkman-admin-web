import { lazy, type ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  ListTree,
  MapPinned,
  Package,
  Shapes,
  Store,
  UserRound,
} from 'lucide-react'

export type AdminModule = {
  id: string
  path: string
  label: string
  icon: LucideIcon
  component: ComponentType
  permission?: string
  showInSidebar?: boolean
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
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const StoreCategoriesPage = lazy(() =>
  import('../pages/StoreCategoriesPage').then((module) => ({ default: module.StoreCategoriesPage })),
)
const StoresPage = lazy(() => import('../pages/StoresPage').then((module) => ({ default: module.StoresPage })))
const ZonesPage = lazy(() => import('../pages/ZonesPage').then((module) => ({ default: module.ZonesPage })))

const productPermissions = crudPermissions('products.manage')
const storePermissions = crudPermissions('stores.manage')
const settingsPermissions = crudPermissions('settings.update')

export const adminModules: AdminModule[] = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard, component: DashboardPage },
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
  {
    id: 'profile',
    path: '/profile',
    label: 'My Profile',
    icon: UserRound,
    component: ProfilePage,
    showInSidebar: false,
  },
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
