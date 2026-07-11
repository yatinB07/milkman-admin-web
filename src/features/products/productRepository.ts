import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type {
  OptionsApiResponse,
  ProductPayload,
  ProductRow,
  ProductsApiResponse,
  StoreCategoryOption,
  StoreOption,
} from './productTypes'

export async function listProducts(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<ProductRow>> {
  const response = await api.get<ProductsApiResponse>('/api/v1/admin/products', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function listProductStores(): Promise<StoreOption[]> {
  const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function listProductStoreCategories(): Promise<StoreCategoryOption[]> {
  const response = await api.get<OptionsApiResponse<StoreCategoryOption>>('/api/v1/admin/store-categories', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createProduct(values: ProductPayload): Promise<ProductRow> {
  const response = await api.post<{ data: ProductRow }>('/api/v1/admin/products', values)

  return response.data.data
}

export async function updateProduct(productId: number, values: ProductPayload): Promise<ProductRow> {
  const response = await api.put<{ data: ProductRow }>(`/api/v1/admin/products/${productId}`, values)

  return response.data.data
}

export async function deleteProduct(productId: number): Promise<void> {
  await api.delete(`/api/v1/admin/products/${productId}`)
}
