import { lazy, Suspense, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AdminShell } from './components/AdminShell'
import { LoginPage } from './components/LoginPage'
import { navigationItems } from './data/adminDashboard'
import { api } from './lib/api'
import { adminStore, canAccess, type AdminUser, useAdminStore } from './store/adminStore'
import './App.css'

const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then((module) => ({ default: module.CategoriesPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProductVariantsPage = lazy(() =>
  import('./pages/ProductVariantsPage').then((module) => ({ default: module.ProductVariantsPage })),
)
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const StoreCategoriesPage = lazy(() =>
  import('./pages/StoreCategoriesPage').then((module) => ({ default: module.StoreCategoriesPage })),
)
const StoresPage = lazy(() => import('./pages/StoresPage').then((module) => ({ default: module.StoresPage })))
const ZonesPage = lazy(() => import('./pages/ZonesPage').then((module) => ({ default: module.ZonesPage })))

type LoginResponse = {
  data: {
    token: string
    user: AdminUser
  }
}

type CurrentUserResponse = {
  data: {
    user: AdminUser
  }
}

function App() {
  const { activePage, theme, token, user } = useAdminStore()
  const visibleNavigationItems = navigationItems.filter((item) => canAccess(user, item.permission))

  const currentUser = useQuery({
    queryKey: ['admin-auth-me'],
    queryFn: async () => {
      const response = await api.get<CurrentUserResponse>('/api/v1/admin/auth/me')

      return response.data.data.user
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await api.post<LoginResponse>('/api/v1/admin/auth/login', credentials)

      return response.data.data
    },
    onSuccess: (result) => {
      adminStore.login(result.token, result.user)
    },
  })

  useEffect(() => {
    if (currentUser.data) {
      adminStore.setUser(currentUser.data)
    }
  }, [currentUser.data])

  useEffect(() => {
    if (currentUser.isError) {
      adminStore.logout()
    }
  }, [currentUser.isError])

  useEffect(() => {
    const activeItem = navigationItems.find((item) => item.label === activePage)

    if (activeItem && !canAccess(user, activeItem.permission)) {
      adminStore.setActivePage('Dashboard')
    }
  }, [activePage, user])

  if (!token) {
    return (
      <LoginPage
        onLogin={(credentials) => login.mutate(credentials)}
        isLoading={login.isPending}
        error={login.isError ? 'Unable to sign in with those credentials.' : undefined}
      />
    )
  }

  if (!user && currentUser.isLoading) {
    return <div className="module-loading">Loading admin session...</div>
  }

  return (
    <AdminShell
      activePage={activePage}
      onNavigate={adminStore.setActivePage}
      theme={theme}
      onToggleTheme={adminStore.toggleTheme}
      onLogout={adminStore.logout}
      user={user}
      navigationItems={visibleNavigationItems}
    >
      <Suspense fallback={<div className="module-loading">Loading module...</div>}>
        {activePage === 'Stores' ? (
          <StoresPage />
        ) : activePage === 'Products' ? (
          <ProductsPage />
        ) : activePage === 'Product Variants' ? (
          <ProductVariantsPage />
        ) : activePage === 'Store Categories' ? (
          <StoreCategoriesPage />
        ) : activePage === 'Categories' ? (
          <CategoriesPage />
        ) : activePage === 'Zones' ? (
          <ZonesPage />
        ) : (
          <DashboardPage />
        )}
      </Suspense>
    </AdminShell>
  )
}

export default App
