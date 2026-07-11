import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type { ZoneApiResponse, ZonePayload, ZoneRow, ZonesApiResponse } from './zoneTypes'

export async function listZones(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<ZoneRow>> {
  const response = await api.get<ZonesApiResponse>('/api/v1/admin/zones', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function createZone(values: ZonePayload): Promise<ZoneRow> {
  const response = await api.post<{ data: ZoneRow }>('/api/v1/admin/zones', values)

  return response.data.data
}

export async function getZone(zoneId: number): Promise<ZoneRow> {
  const response = await api.get<ZoneApiResponse>(`/api/v1/admin/zones/${zoneId}`)

  return response.data.data
}

export async function updateZone(zoneId: number, values: ZonePayload): Promise<ZoneRow> {
  const response = await api.put<{ data: ZoneRow }>(`/api/v1/admin/zones/${zoneId}`, values)

  return response.data.data
}

export async function deleteZone(zoneId: number): Promise<void> {
  await api.delete(`/api/v1/admin/zones/${zoneId}`)
}
