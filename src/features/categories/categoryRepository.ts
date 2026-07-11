import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type { CategoriesApiResponse, CategoryApiResponse, CategoryPayload, CategoryRow } from './categoryTypes'

export async function listCategories(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<CategoryRow>> {
  const response = await api.get<CategoriesApiResponse>('/api/v1/admin/categories', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function createCategory(values: CategoryPayload): Promise<CategoryRow> {
  const response = await api.post<{ data: CategoryRow }>('/api/v1/admin/categories', values)

  return response.data.data
}

export async function getCategory(categoryId: number): Promise<CategoryRow> {
  const response = await api.get<CategoryApiResponse>(`/api/v1/admin/categories/${categoryId}`)

  return response.data.data
}

export async function updateCategory(categoryId: number, values: CategoryPayload): Promise<CategoryRow> {
  const response = await api.put<{ data: CategoryRow }>(`/api/v1/admin/categories/${categoryId}`, values)

  return response.data.data
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await api.delete(`/api/v1/admin/categories/${categoryId}`)
}
