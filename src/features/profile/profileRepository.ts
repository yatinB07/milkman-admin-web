import { api } from '../../lib/api'
import type { AdminPasswordPayload, AdminProfile, AdminProfilePayload, AdminProfileResponse } from './profileTypes'

export async function getAdminProfile(): Promise<AdminProfile> {
  const response = await api.get<AdminProfileResponse>('/api/v1/admin/profile')

  return response.data.data
}

export async function updateAdminProfile(values: AdminProfilePayload): Promise<AdminProfile> {
  const response = await api.put<AdminProfileResponse>('/api/v1/admin/profile', values)

  return response.data.data
}

export async function updateAdminPassword(values: AdminPasswordPayload): Promise<AdminProfile> {
  const response = await api.put<AdminProfileResponse>('/api/v1/admin/password', values)

  return response.data.data
}
