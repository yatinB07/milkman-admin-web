import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type StoreCategoryRow = {
  id: number
  store_id: number
  title: string
  image_path: string | null
  is_active: boolean
  store?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

export type StoreOption = { id: number; title: string }
export type OptionsApiResponse<T> = { data: T[] }
export type StoreCategoriesApiResponse = {
  data: StoreCategoryRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type StoreCategoryApiResponse = { data: StoreCategoryRow }

export type StoreCategoryFormValues = {
  store_id: string
  title: string
  image_path: string
  is_active: boolean
}

export type StoreCategoryPayload = {
  store_id: number
  title: string
  image_path: string | null
  is_active: boolean
}

export type StoreCategoryListRow = StoreCategoryRow & { serialNumber: number }
