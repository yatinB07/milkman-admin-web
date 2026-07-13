import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type {
  OptionsApiResponse,
  ProductImageApiResponse,
  ProductImagePayload,
  ProductImageRow,
  ProductImagesApiResponse,
  ProductOption,
  StoreOption,
} from './productImageTypes'

export async function listProductImages(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<ProductImageRow>> {
  const response = await api.get<ProductImagesApiResponse>('/api/v1/admin/product-images', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function listProductImageStores(): Promise<StoreOption[]> {
  const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function listProductImageProducts(): Promise<ProductOption[]> {
  const response = await api.get<OptionsApiResponse<ProductOption>>('/api/v1/admin/products', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createProductImage(values: ProductImagePayload): Promise<ProductImageRow> {
  const response = await api.post<{ data: ProductImageRow }>('/api/v1/admin/product-images', values)

  return response.data.data
}

export async function getProductImage(productImageId: number): Promise<ProductImageRow> {
  const response = await api.get<ProductImageApiResponse>(`/api/v1/admin/product-images/${productImageId}`)

  return response.data.data
}

export async function updateProductImage(productImageId: number, values: ProductImagePayload): Promise<ProductImageRow> {
  const response = await api.put<{ data: ProductImageRow }>(`/api/v1/admin/product-images/${productImageId}`, values)

  return response.data.data
}

export async function deleteProductImage(productImageId: number): Promise<void> {
  await api.delete(`/api/v1/admin/product-images/${productImageId}`)
}
