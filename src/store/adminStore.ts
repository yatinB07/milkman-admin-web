import { useSyncExternalStore } from 'react'
import { clearAuthToken, getAuthToken, setAuthToken } from '../lib/api'

const userStorageKey = 'milkman_admin_user'
const themeStorageKey = 'milkman_admin_theme'
const listPerPageStorageKey = 'milkman_admin_list_per_page'
const defaultListPerPage = 10
const allowedListPerPage = [10, 15, 25, 50, 100]

export type AdminUser = {
  id: number
  type: string
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

type AdminState = {
  listPerPage: number
  theme: 'light' | 'dark'
  token: string | null
  user: AdminUser | null
}

type Listener = () => void

let state: AdminState = {
  listPerPage: readListPerPage(),
  theme: window.localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light',
  token: getAuthToken(),
  user: null,
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
    window.localStorage.removeItem(userStorageKey)
    updateState({ token, user })
  },
  setUser(user: AdminUser) {
    window.localStorage.removeItem(userStorageKey)
    updateState({ user })
  },
  logout() {
    clearAuthToken()
    window.localStorage.removeItem(userStorageKey)
    updateState({ token: null, user: null })
  },
  setListPerPage(listPerPage: number) {
    const nextListPerPage = allowedListPerPage.includes(listPerPage) ? listPerPage : defaultListPerPage
    window.localStorage.setItem(listPerPageStorageKey, String(nextListPerPage))
    updateState({ listPerPage: nextListPerPage })
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

function readListPerPage() {
  const value = Number(window.localStorage.getItem(listPerPageStorageKey))

  return allowedListPerPage.includes(value) ? value : defaultListPerPage
}
