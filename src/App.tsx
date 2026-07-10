import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AdminShell } from './components/AdminShell'
import { LoginPage } from './components/LoginPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { DashboardPage } from './pages/DashboardPage'
import { StoreCategoriesPage } from './pages/StoreCategoriesPage'
import { StoresPage } from './pages/StoresPage'
import { ZonesPage } from './pages/ZonesPage'
import { api, clearAuthToken, getAuthToken, setAuthToken } from './lib/api'
import './App.css'

type AdminUser = {
  id: number
  type: string
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

type LoginResponse = {
  data: {
    token: string
    user: AdminUser
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthToken()))
  const [activePage, setActivePage] = useState('Dashboard')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return window.localStorage.getItem('milkman_admin_theme') === 'dark' ? 'dark' : 'light'
  })

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await api.post<LoginResponse>('/api/v1/admin/auth/login', credentials)

      return response.data.data
    },
    onSuccess: (result) => {
      setAuthToken(result.token)
      setIsAuthenticated(true)
      setActivePage('Dashboard')
    },
  })

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={(credentials) => login.mutate(credentials)}
        isLoading={login.isPending}
        error={login.isError ? 'Unable to sign in with those credentials.' : undefined}
      />
    )
  }

  return (
    <AdminShell
      activePage={activePage}
      onNavigate={setActivePage}
      theme={theme}
      onToggleTheme={() => {
        setTheme((currentTheme) => {
          const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
          window.localStorage.setItem('milkman_admin_theme', nextTheme)

          return nextTheme
        })
      }}
      onLogout={() => {
        clearAuthToken()
        setIsAuthenticated(false)
      }}
    >
      {activePage === 'Stores' ? (
        <StoresPage />
      ) : activePage === 'Store Categories' ? (
        <StoreCategoriesPage />
      ) : activePage === 'Categories' ? (
        <CategoriesPage />
      ) : activePage === 'Zones' ? (
        <ZonesPage />
      ) : (
        <DashboardPage />
      )}
    </AdminShell>
  )
}

export default App
