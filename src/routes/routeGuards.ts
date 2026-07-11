import { adminModules } from './adminModules'
import { canAccess, type AdminUser } from '../store/adminStore'

export function shouldRedirectUnauthorizedRoute(path: string, user: AdminUser | null) {
  if (!user) return false

  const activeItem = adminModules.find((item) => item.path === path)

  return Boolean(activeItem && !canAccess(user, activeItem.permission))
}
