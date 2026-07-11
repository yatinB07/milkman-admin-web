import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type { OptionsApiResponse, SelectOption, StorePayload, StoreRow, StoresApiResponse } from './storeTypes'

export async function listStores(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<StoreRow>> {
  const response = await api.get<StoresApiResponse>('/api/v1/admin/stores', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function getStore(storeId: number): Promise<StoreRow> {
  const response = await api.get<{ data: StoreRow }>(`/api/v1/admin/stores/${storeId}`)

  return response.data.data
}

export async function listStoreZones(): Promise<SelectOption[]> {
  const response = await api.get<OptionsApiResponse>('/api/v1/admin/zones', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function listStoreCategories(): Promise<SelectOption[]> {
  const response = await api.get<OptionsApiResponse>('/api/v1/admin/categories', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createStore(values: StorePayload): Promise<StoreRow> {
  const response = await api.post<{ data: StoreRow }>('/api/v1/admin/stores', values)

  return response.data.data
}

export async function updateStore(storeId: number, values: StorePayload): Promise<StoreRow> {
  const response = await api.put<{ data: StoreRow }>(`/api/v1/admin/stores/${storeId}`, values)

  return response.data.data
}

export async function deleteStore(storeId: number): Promise<void> {
  await api.delete(`/api/v1/admin/stores/${storeId}`)
}
