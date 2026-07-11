import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type ProductVariantRow = {
  id: number
  store_id: number
  product_id: number
  title: string
  subscribe_price: string | number
  normal_price: string | number
  discount: string | number | null
  is_out_of_stock: boolean
  is_subscription_required: boolean
  store?: { id: number; title: string } | null
  product?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

export type StoreOption = { id: number; title: string }
export type ProductOption = { id: number; store_id: number; title: string }
export type OptionsApiResponse<T> = { data: T[] }
export type ProductVariantsApiResponse = {
  data: ProductVariantRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type ProductVariantApiResponse = { data: ProductVariantRow }

export type ProductVariantFormValues = {
  store_id: string
  product_id: string
  title: string
  normal_price: string
  subscribe_price: string
  discount: string
  is_out_of_stock: boolean
  is_subscription_required: boolean
}

export type ProductVariantPayload = {
  store_id: number
  product_id: number
  title: string
  normal_price: number
  subscribe_price: number
  discount: number
  is_out_of_stock: boolean
  is_subscription_required: boolean
}

export type ProductVariantListRow = ProductVariantRow & { serialNumber: number }
