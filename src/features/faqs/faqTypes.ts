import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type FaqRow = {
  id: number
  store_id: number
  question: string
  answer: string
  is_active: boolean
  store?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

export type StoreOption = { id: number; title: string }

export type OptionsApiResponse<T> = { data: T[] }
export type FaqsApiResponse = {
  data: FaqRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type FaqApiResponse = { data: FaqRow }

export type FaqFormValues = {
  store_id: string
  question: string
  answer: string
  is_active: boolean
}

export type FaqPayload = {
  store_id: number
  question: string
  answer: string
  is_active: boolean
}

export type FaqListRow = FaqRow & { serialNumber: number }
