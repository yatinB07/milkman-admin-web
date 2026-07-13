import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type StoreGalleryImageRow = {
  id: number
  store_id: number
  image_path: string
  is_active: boolean
  store?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

export type StoreOption = { id: number; title: string }

export type OptionsApiResponse<T> = { data: T[] }
export type StoreGalleryImagesApiResponse = {
  data: StoreGalleryImageRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type StoreGalleryImageApiResponse = { data: StoreGalleryImageRow }

export type StoreGalleryImageFormValues = {
  store_id: string
  image_path: string
  is_active: boolean
}

export type StoreGalleryImagePayload = {
  store_id: number
  image_path: string
  is_active: boolean
}

export type StoreGalleryImageListRow = StoreGalleryImageRow & { serialNumber: number }
