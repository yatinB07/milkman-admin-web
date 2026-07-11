import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AdminUser } from './adminStore'

const adminUser: AdminUser = {
  id: 1,
  type: 'admin',
  name: 'Admin User',
  email: 'admin@example.com',
  roles: ['admin'],
  permissions: ['products.manage'],
}

async function loadAdminStore() {
  vi.resetModules()

  return import('./adminStore')
}

describe('adminStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('persists valid list page sizes and falls back for invalid values', async () => {
    const { adminStore } = await loadAdminStore()

    expect(adminStore.getSnapshot().listPerPage).toBe(10)

    adminStore.setListPerPage(25)

    expect(adminStore.getSnapshot().listPerPage).toBe(25)
    expect(window.localStorage.getItem('milkman_admin_list_per_page')).toBe('25')

    adminStore.setListPerPage(12)

    expect(adminStore.getSnapshot().listPerPage).toBe(10)
    expect(window.localStorage.getItem('milkman_admin_list_per_page')).toBe('10')
  })

  it('persists theme and sidebar preferences', async () => {
    const { adminStore } = await loadAdminStore()

    adminStore.toggleTheme()
    adminStore.toggleSidebar()

    expect(adminStore.getSnapshot().theme).toBe('dark')
    expect(adminStore.getSnapshot().sidebarCollapsed).toBe(true)
    expect(window.localStorage.getItem('milkman_admin_theme')).toBe('dark')
    expect(window.localStorage.getItem('milkman_admin_sidebar_collapsed')).toBe('1')
  })

  it('stores auth on login and clears it on logout', async () => {
    const { adminStore } = await loadAdminStore()

    adminStore.login('demo-token', adminUser)

    expect(adminStore.getSnapshot().token).toBe('demo-token')
    expect(adminStore.getSnapshot().user).toEqual(adminUser)
    expect(window.localStorage.getItem('milkman_admin_token')).toBe('demo-token')

    adminStore.logout()

    expect(adminStore.getSnapshot().token).toBeNull()
    expect(adminStore.getSnapshot().user).toBeNull()
    expect(window.localStorage.getItem('milkman_admin_token')).toBeNull()
  })
})

describe('canAccess', () => {
  it('allows open routes, matching permissions, and super admins', async () => {
    const { canAccess } = await loadAdminStore()

    expect(canAccess(null)).toBe(true)
    expect(canAccess(null, 'products.manage')).toBe(false)
    expect(canAccess(adminUser, 'products.manage')).toBe(true)
    expect(canAccess(adminUser, 'stores.manage')).toBe(false)
    expect(canAccess({ ...adminUser, roles: ['super-admin'], permissions: [] }, 'stores.manage')).toBe(true)
  })
})
