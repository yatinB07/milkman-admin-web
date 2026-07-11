import { adminModules, getActiveAdminModule } from './adminModules'
import { canAccess, type AdminUser } from '../store/adminStore'

export function shouldRedirectUnauthorizedRoute(path: string, user: AdminUser | null) {
  if (!user) return false

  const activeItem = getActiveAdminModule(adminModules, path)

  return Boolean(activeItem && !canAccess(user, activeItem.permission))
}
