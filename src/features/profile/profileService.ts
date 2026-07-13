import type { AdminProfileFormValues, AdminProfilePayload } from './profileTypes'

export function toAdminProfilePayload(values: AdminProfileFormValues): AdminProfilePayload {
  return {
    name: values.name.trim(),
    username: values.username.trim(),
  }
}
