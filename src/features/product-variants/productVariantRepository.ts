import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type {
  OptionsApiResponse,
  ProductOption,
  ProductVariantPayload,
  ProductVariantRow,
  ProductVariantsApiResponse,
  StoreOption,
} from './productVariantTypes'

export async function listProductVariants(query: {
  page: number
  perPage: number
  search: string
  stockStatus?: string
}): Promise<PaginatedResponse<ProductVariantRow>> {
  const response = await api.get<ProductVariantsApiResponse>('/api/v1/admin/product-variants', {
    params: toApiListParams({
      ...query,
      filters: {
        is_out_of_stock: query.stockStatus === 'all' ? undefined : query.stockStatus === 'out-of-stock',
      },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function listVariantStores(): Promise<StoreOption[]> {
  const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function listVariantProducts(): Promise<ProductOption[]> {
  const response = await api.get<OptionsApiResponse<ProductOption>>('/api/v1/admin/products', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createProductVariant(values: ProductVariantPayload): Promise<ProductVariantRow> {
  const response = await api.post<{ data: ProductVariantRow }>('/api/v1/admin/product-variants', values)

  return response.data.data
}

export async function updateProductVariant(
  variantId: number,
  values: ProductVariantPayload,
): Promise<ProductVariantRow> {
  const response = await api.put<{ data: ProductVariantRow }>(
    `/api/v1/admin/product-variants/${variantId}`,
    values,
  )

  return response.data.data
}

export async function deleteProductVariant(variantId: number): Promise<void> {
  await api.delete(`/api/v1/admin/product-variants/${variantId}`)
}
