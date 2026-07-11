import { Suspense, useEffect } from 'react'
import { useSyncExternalStore } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AdminShell } from './components/AdminShell'
import { LoginPage } from './components/LoginPage'
import { api, setUnauthorizedHandler } from './lib/api'
import { adminModules } from './routes/adminModules'
import { adminStore, canAccess, type AdminUser, useAdminStore } from './store/adminStore'
import './App.css'

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
  const { sidebarCollapsed, theme, token, user } = useAdminStore()
  const activePath = useHashPath()
  const visibleModules = adminModules.filter((module) => canAccess(user, module.permission))
  const sidebarModules = visibleModules.filter((module) => module.showInSidebar !== false)
  const profileModule = visibleModules.find((module) => module.id === 'profile')
  const activeModule = visibleModules.find((module) => module.path === activePath) ?? visibleModules[0]
  const ActivePage = activeModule.component

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
      navigateToPath('/')
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
    setUnauthorizedHandler(adminStore.logout)

    return () => setUnauthorizedHandler(null)
  }, [])

  useEffect(() => {
    const activeItem = adminModules.find((item) => item.path === activePath)

    if (activeItem && !canAccess(user, activeItem.permission)) {
      navigateToPath('/')
    }
  }, [activePath, user])

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

  if (!user) {
    return <div className="module-loading">Preparing admin session...</div>
  }

  return (
    <AdminShell
      activeModuleId={activeModule.id}
      onNavigate={(module) => navigateToPath(module.path)}
      theme={theme}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={adminStore.toggleSidebar}
      onToggleTheme={adminStore.toggleTheme}
      onLogout={adminStore.logout}
      user={user}
      navigationItems={sidebarModules}
      profileModule={profileModule}
    >
      <Suspense fallback={<div className="module-loading">Loading module...</div>}>
        <ActivePage />
      </Suspense>
    </AdminShell>
  )
}

export default App

function useHashPath() {
  return useSyncExternalStore(subscribeToHash, getHashPath, getHashPath)
}

function subscribeToHash(listener: () => void) {
  window.addEventListener('hashchange', listener)

  return () => window.removeEventListener('hashchange', listener)
}

function getHashPath() {
  const path = window.location.hash.replace(/^#/, '')

  return normalizePath(path)
}

function navigateToPath(path: string) {
  const nextPath = normalizePath(path)

  if (getHashPath() === nextPath) return

  window.location.hash = nextPath
}

function normalizePath(path: string) {
  if (!path || path === '#') return '/'

  return path.startsWith('/') ? path : `/${path}`
}
