import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type {
  OptionsApiResponse,
  StoreGalleryImageApiResponse,
  StoreGalleryImagePayload,
  StoreGalleryImageRow,
  StoreGalleryImagesApiResponse,
  StoreOption,
} from './storeGalleryImageTypes'

export async function listStoreGalleryImages(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<StoreGalleryImageRow>> {
  const response = await api.get<StoreGalleryImagesApiResponse>('/api/v1/admin/store-gallery-images', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function listStoreGalleryImageStores(): Promise<StoreOption[]> {
  const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createStoreGalleryImage(values: StoreGalleryImagePayload): Promise<StoreGalleryImageRow> {
  const response = await api.post<{ data: StoreGalleryImageRow }>('/api/v1/admin/store-gallery-images', values)

  return response.data.data
}

export async function getStoreGalleryImage(storeGalleryImageId: number): Promise<StoreGalleryImageRow> {
  const response = await api.get<StoreGalleryImageApiResponse>(`/api/v1/admin/store-gallery-images/${storeGalleryImageId}`)

  return response.data.data
}

export async function updateStoreGalleryImage(storeGalleryImageId: number, values: StoreGalleryImagePayload): Promise<StoreGalleryImageRow> {
  const response = await api.put<{ data: StoreGalleryImageRow }>(`/api/v1/admin/store-gallery-images/${storeGalleryImageId}`, values)

  return response.data.data
}

export async function deleteStoreGalleryImage(storeGalleryImageId: number): Promise<void> {
  await api.delete(`/api/v1/admin/store-gallery-images/${storeGalleryImageId}`)
}
