import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type {
  OptionsApiResponse,
  StoreCategoriesApiResponse,
  StoreCategoryApiResponse,
  StoreCategoryPayload,
  StoreCategoryRow,
  StoreOption,
} from './storeCategoryTypes'

export async function listStoreCategories(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<StoreCategoryRow>> {
  const response = await api.get<StoreCategoriesApiResponse>('/api/v1/admin/store-categories', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function listStoreCategoryStores(): Promise<StoreOption[]> {
  const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createStoreCategory(values: StoreCategoryPayload): Promise<StoreCategoryRow> {
  const response = await api.post<{ data: StoreCategoryRow }>('/api/v1/admin/store-categories', values)

  return response.data.data
}

export async function getStoreCategory(categoryId: number): Promise<StoreCategoryRow> {
  const response = await api.get<StoreCategoryApiResponse>(`/api/v1/admin/store-categories/${categoryId}`)

  return response.data.data
}

export async function updateStoreCategory(
  categoryId: number,
  values: StoreCategoryPayload,
): Promise<StoreCategoryRow> {
  const response = await api.put<{ data: StoreCategoryRow }>(
    `/api/v1/admin/store-categories/${categoryId}`,
    values,
  )

  return response.data.data
}

export async function deleteStoreCategory(categoryId: number): Promise<void> {
  await api.delete(`/api/v1/admin/store-categories/${categoryId}`)
}
