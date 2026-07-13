import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type ProductImageRow = {
  id: number
  store_id: number
  product_id: number
  image_path: string
  is_active: boolean
  store?: { id: number; title: string } | null
  product?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

export type StoreOption = { id: number; title: string }
export type ProductOption = { id: number; store_id: number; title: string }

export type OptionsApiResponse<T> = { data: T[] }
export type ProductImagesApiResponse = {
  data: ProductImageRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type ProductImageApiResponse = { data: ProductImageRow }

export type ProductImageFormValues = {
  store_id: string
  product_id: string
  image_path: string
  is_active: boolean
}

export type ProductImagePayload = {
  store_id: number
  product_id: number
  image_path: string
  is_active: boolean
}

export type ProductImageListRow = ProductImageRow & { serialNumber: number }
