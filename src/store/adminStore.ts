import { useSyncExternalStore } from 'react'
import { clearAuthToken, getAuthToken, setAuthToken } from '../lib/api'

const userStorageKey = 'milkman_admin_user'
const themeStorageKey = 'milkman_admin_theme'

export type AdminUser = {
  id: number
  type: string
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

type AdminState = {
  activePage: string
  theme: 'light' | 'dark'
  token: string | null
  user: AdminUser | null
}

type Listener = () => void

let state: AdminState = {
  activePage: 'Dashboard',
  theme: window.localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light',
  token: getAuthToken(),
  user: readStoredUser(),
}

const listeners = new Set<Listener>()

export const adminStore = {
  getSnapshot: () => state,
  subscribe(listener: Listener) {
    listeners.add(listener)

    return () => listeners.delete(listener)
  },
  login(token: string, user: AdminUser) {
    setAuthToken(token)
    window.localStorage.setItem(userStorageKey, JSON.stringify(user))
    updateState({ token, user, activePage: 'Dashboard' })
  },
  setUser(user: AdminUser) {
    window.localStorage.setItem(userStorageKey, JSON.stringify(user))
    updateState({ user })
  },
  logout() {
    clearAuthToken()
    window.localStorage.removeItem(userStorageKey)
    updateState({ token: null, user: null, activePage: 'Dashboard' })
  },
  setActivePage(activePage: string) {
    updateState({ activePage })
  },
  toggleTheme() {
    const theme = state.theme === 'dark' ? 'light' : 'dark'
    window.localStorage.setItem(themeStorageKey, theme)
    updateState({ theme })
  },
  can(permission?: string) {
    return canAccess(state.user, permission)
  },
}

export function useAdminStore() {
  return useSyncExternalStore(adminStore.subscribe, adminStore.getSnapshot, adminStore.getSnapshot)
}

export function canAccess(user: AdminUser | null, permission?: string) {
  if (!permission) return true
  if (!user) return false
  if (user.roles.includes('super-admin')) return true

  return user.permissions.includes(permission)
}

function updateState(nextState: Partial<AdminState>) {
  state = { ...state, ...nextState }
  listeners.forEach((listener) => listener())
}

function readStoredUser(): AdminUser | null {
  const rawUser = window.localStorage.getItem(userStorageKey)

  if (!rawUser) return null

  try {
    return JSON.parse(rawUser) as AdminUser
  } catch {
    window.localStorage.removeItem(userStorageKey)
    return null
  }
}
