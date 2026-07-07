import { useState } from 'react'
import { AdminShell } from './components/AdminShell'
import { LoginPage } from './components/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <AdminShell onLogout={() => setIsAuthenticated(false)}>
      <DashboardPage />
    </AdminShell>
  )
}

export default App
