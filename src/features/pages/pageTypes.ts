import type { normalizePaginationMeta } from '../../lib/apiTypes'

export type PageRow = {
  id: number
  title: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PagesApiResponse = {
  data: PageRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}
export type PageApiResponse = { data: PageRow }

export type PageFormValues = {
  title: string
  description: string
  is_active: boolean
}

export type PagePayload = PageFormValues

export type PageListRow = PageRow & { serialNumber: number }
