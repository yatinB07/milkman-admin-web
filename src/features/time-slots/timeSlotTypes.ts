import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type TimeSlotRow = {
  id: number
  store_id: number
  starts_at: string
  ends_at: string
  is_active: boolean
  store?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

export type StoreOption = { id: number; title: string }

export type OptionsApiResponse<T> = { data: T[] }
export type TimeSlotsApiResponse = {
  data: TimeSlotRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type TimeSlotApiResponse = { data: TimeSlotRow }

export type TimeSlotFormValues = {
  store_id: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

export type TimeSlotPayload = {
  store_id: number
  starts_at: string
  ends_at: string
  is_active: boolean
}

export type TimeSlotListRow = TimeSlotRow & { serialNumber: number }
