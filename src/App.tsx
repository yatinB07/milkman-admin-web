import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AdminShell } from './components/AdminShell'
import { LoginPage } from './components/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { StoresPage } from './pages/StoresPage'
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
      onLogout={() => {
        clearAuthToken()
        setIsAuthenticated(false)
      }}
    >
      {activePage === 'Stores' ? <StoresPage /> : <DashboardPage />}
    </AdminShell>
  )
}

export default App
