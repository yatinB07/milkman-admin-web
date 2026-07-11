import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type ZoneRow = {
  id: number
  title: string
  coordinates: string
  alias: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ZoneFormValues = {
  title: string
  coordinates: string
  alias: string
  is_active: boolean
}

export type ZoneFormErrors = Partial<Record<keyof ZoneFormValues, string>>

export type ZonePayload = {
  title: string
  coordinates: string
  alias: string
  is_active: boolean
}

export type ZonesApiResponse = {
  data: ZoneRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type ZoneApiResponse = { data: ZoneRow }
