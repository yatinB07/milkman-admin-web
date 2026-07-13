import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type CouponRow = {
  id: number
  store_id: number
  image_path: string | null
  title: string
  code: string
  subtitle: string | null
  expires_at: string | null
  minimum_amount: string | number
  value: string | number
  description: string | null
  is_active: boolean
  store?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

export type StoreOption = { id: number; title: string }

export type OptionsApiResponse<T> = { data: T[] }
export type CouponsApiResponse = {
  data: CouponRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type CouponApiResponse = { data: CouponRow }

export type CouponFormValues = {
  store_id: string
  image_path: string
  title: string
  code: string
  subtitle: string
  expires_at: string
  minimum_amount: string
  value: string
  description: string
  is_active: boolean
}

export type CouponPayload = {
  store_id: number
  image_path: string | null
  title: string
  code: string
  subtitle: string | null
  expires_at: string | null
  minimum_amount: number
  value: number
  description: string | null
  is_active: boolean
}

export type CouponListRow = CouponRow & { serialNumber: number }
