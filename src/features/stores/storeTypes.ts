import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type StoreRow = {
  id: number
  title: string
  zone_id: number | null
  image_path: string | null
  cover_image_path: string | null
  rating: string | number | null
  slogan: string | null
  slogan_title: string | null
  language_code: string | null
  category_reference: string | null
  email: string | null
  country_code: string | null
  mobile: string | null
  full_address: string | null
  pincode: string | null
  landmark: string | null
  short_description: string | null
  content_description: string | null
  latitude: string | number | null
  longitude: string | number | null
  store_charge: string | number | null
  delivery_charge: string | number | null
  minimum_order_amount: string | number | null
  commission_percent: string | number | null
  opens_at: string | null
  closes_at: string | null
  is_pickup_enabled: boolean
  is_active: boolean
  registration_status: string | number | null
  charge_type: string | number | null
  unit_kilometers: string | number | null
  unit_price: string | number | null
  additional_price: string | number | null
  bank_name: string | null
  ifsc_code: string | null
  receipt_name: string | null
  account_number: string | null
  paypal_id: string | null
  upi_id: string | null
  cancel_policy: string | null
  zone?: {
    id: number
    title: string
  } | null
}

export type StoreFormValues = {
  title: string
  image_path: string
  cover_image_path: string
  rating: string
  language_code: string
  mobile: string
  slogan: string
  slogan_title: string
  opens_at: string
  closes_at: string
  is_pickup_enabled: boolean
  is_active: boolean
  short_description: string
  content_description: string
  cancel_policy: string
  email: string
  password?: string
  category_reference: string
  full_address: string
  pincode: string
  landmark: string
  zone_id: string
  latitude: string
  longitude: string
  charge_type: string
  delivery_charge: string
  unit_kilometers: string
  unit_price: string
  additional_price: string
  store_charge: string
  minimum_order_amount: string
  commission_percent: string
  bank_name: string
  ifsc_code: string
  receipt_name: string
  account_number: string
  paypal_id: string
  upi_id: string
}

export type SelectOption = {
  id: number
  title: string
}

export type StoreListRow = StoreRow & {
  serialNumber: number
}

export type StoresApiResponse = {
  data: StoreRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}

export type OptionsApiResponse = {
  data: SelectOption[]
}

export type StorePayload = Record<string, string | number | boolean | null>
