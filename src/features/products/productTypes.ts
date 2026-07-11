import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type ProductRow = {
  id: number
  store_id: number
  store_category_id: number
  title: string
  image_path: string | null
  description: string | null
  is_active: boolean
  store?: { id: number; title: string } | null
  store_category?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

export type StoreOption = { id: number; title: string }
export type StoreCategoryOption = { id: number; store_id: number; title: string }

export type OptionsApiResponse<T> = { data: T[] }
export type ProductsApiResponse = {
  data: ProductRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type ProductApiResponse = { data: ProductRow }

export type ProductFormValues = {
  store_id: string
  store_category_id: string
  title: string
  image_path: string
  description: string
  is_active: boolean
}

export type ProductPayload = {
  store_id: number
  store_category_id: number
  title: string
  image_path: string | null
  description: string | null
  is_active: boolean
}

export type ProductListRow = ProductRow & { serialNumber: number }
