import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type CategoryRow = {
  id: number
  title: string
  image_path: string | null
  cover_path: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CategoriesApiResponse = {
  data: CategoryRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type CategoryApiResponse = { data: CategoryRow }

export type CategoryFormValues = {
  title: string
  image_path: string
  cover_path: string
  is_active: boolean
}

export type CategoryPayload = {
  title: string
  image_path: string | null
  cover_path: string | null
  is_active: boolean
}

export type CategoryListRow = CategoryRow & { serialNumber: number }
