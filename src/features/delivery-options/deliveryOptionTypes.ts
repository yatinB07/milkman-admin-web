import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type DeliveryOptionRow = {
  id: number
  store_id: number
  title: string
  delivery_days: number
  is_active: boolean
  store?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

export type StoreOption = { id: number; title: string }

export type OptionsApiResponse<T> = { data: T[] }
export type DeliveryOptionsApiResponse = {
  data: DeliveryOptionRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type DeliveryOptionApiResponse = { data: DeliveryOptionRow }

export type DeliveryOptionFormValues = {
  store_id: string
  title: string
  delivery_days: string
  is_active: boolean
}

export type DeliveryOptionPayload = {
  store_id: number
  title: string
  delivery_days: number
  is_active: boolean
}

export type DeliveryOptionListRow = DeliveryOptionRow & { serialNumber: number }
