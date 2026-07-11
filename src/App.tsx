import { Suspense, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AdminShell } from './components/AdminShell'
import { ErrorBoundary, PageSkeleton, ToastHost } from './components/common'
import { LoginPage } from './components/LoginPage'
import { api, setUnauthorizedHandler } from './lib/api'
import { adminModules, getActiveAdminModule } from './routes/adminModules'
import { navigateToHash, useHashPath } from './routes/hashRouting'
import { shouldRedirectUnauthorizedRoute } from './routes/routeGuards'
import { adminStore, canAccess, type AdminUser, useAdminStore } from './store/adminStore'
import { dirtyFormStore } from './store/dirtyFormStore'
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
  const confirmedPathRef = useRef(activePath)
  const visibleModules = adminModules.filter((module) => canAccess(user, module.permission))
  const sidebarModules = visibleModules.filter((module) => module.showInSidebar !== false)
  const profileModule = visibleModules.find((module) => module.id === 'profile')
  const activeModule = getActiveAdminModule(visibleModules, activePath) ?? visibleModules[0]
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
      navigateToHash('/')
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
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyFormStore.isDirty()) return

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    if (activePath === confirmedPathRef.current) return

    if (!dirtyFormStore.isDirty()) {
      confirmedPathRef.current = activePath
      return
    }

    if (dirtyFormStore.confirmDiscard()) {
      confirmedPathRef.current = activePath
      return
    }

    navigateToHash(confirmedPathRef.current)
  }, [activePath])

  useEffect(() => {
    if (!shouldRedirectUnauthorizedRoute(activePath, user)) return

    navigateToHash('/')
  }, [activePath, user])

  if (!token) {
    return (
      <>
        <LoginPage
          onLogin={(credentials) => login.mutate(credentials)}
          isLoading={login.isPending}
          error={login.isError ? 'Unable to sign in with those credentials.' : undefined}
        />
        <div className="toast-theme-scope" data-theme={theme}>
          <ToastHost />
        </div>
      </>
    )
  }

  if (!user && currentUser.isLoading) {
    return (
      <>
        <PageSkeleton label="Loading admin session" />
        <div className="toast-theme-scope" data-theme={theme}>
          <ToastHost />
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <PageSkeleton label="Preparing admin session" />
        <div className="toast-theme-scope" data-theme={theme}>
          <ToastHost />
        </div>
      </>
    )
  }

  return (
    <>
      <AdminShell
        activeModule={activeModule}
        activeModuleId={activeModule.id}
        activePath={activePath}
        onNavigate={(module) => {
          if (dirtyFormStore.confirmDiscard()) {
            navigateToHash(module.path)
          }
        }}
        theme={theme}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={adminStore.toggleSidebar}
        onToggleTheme={adminStore.toggleTheme}
        onLogout={() => {
          if (dirtyFormStore.confirmDiscard()) {
            adminStore.logout()
          }
        }}
        user={user}
        navigationItems={sidebarModules}
        profileModule={profileModule}
      >
        <ErrorBoundary resetKey={activeModule.id}>
          <Suspense fallback={<PageSkeleton label={`Loading ${activeModule.label}`} />}>
            <ActivePage />
          </Suspense>
        </ErrorBoundary>
      </AdminShell>
      <div className="toast-theme-scope" data-theme={theme}>
        <ToastHost />
      </div>
    </>
  )
}

export default App
