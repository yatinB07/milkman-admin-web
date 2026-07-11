import { describe, expect, it } from 'vitest'
import { adminModules, getActiveAdminModule } from './routes/adminModules'
import { shouldRedirectUnauthorizedRoute } from './routes/routeGuards'
import type { AdminUser } from './store/adminStore'

const adminUser: AdminUser = {
  id: 1,
  type: 'admin',
  name: 'Admin',
  email: 'admin@example.com',
  roles: ['admin'],
  permissions: ['products.manage'],
}

describe('shouldRedirectUnauthorizedRoute', () => {
  it('keeps public routes available without a module permission', () => {
    expect(shouldRedirectUnauthorizedRoute('/', adminUser)).toBe(false)
  })

  it('does not redirect while the current user is still loading', () => {
    expect(shouldRedirectUnauthorizedRoute('/categories', null)).toBe(false)
  })

  it('keeps authorized deep links after refresh', () => {
    expect(shouldRedirectUnauthorizedRoute('/categories', adminUser)).toBe(false)
  })

  it('redirects unauthorized routes after the user is loaded', () => {
    expect(shouldRedirectUnauthorizedRoute('/stores', adminUser)).toBe(true)
  })

  it('does not redirect unknown paths so the active module fallback can handle them', () => {
    expect(shouldRedirectUnauthorizedRoute('/missing-route', adminUser)).toBe(false)
  })

  it('keeps super admins on permission-gated routes', () => {
    expect(
      shouldRedirectUnauthorizedRoute('/stores/edit/7', {
        ...adminUser,
        roles: ['super-admin'],
        permissions: [],
      }),
    ).toBe(false)
  })
})

describe('getActiveAdminModule', () => {
  it('keeps nested store routes inside the stores module', () => {
    expect(getActiveAdminModule(adminModules, '/stores/edit/12')?.id).toBe('stores')
  })

  it('does not treat prefix collisions as active module routes', () => {
    expect(getActiveAdminModule(adminModules, '/store-categories-extra')).toBeUndefined()
  })
})
