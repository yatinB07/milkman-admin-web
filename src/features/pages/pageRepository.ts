import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type { PageApiResponse, PagePayload, PageRow, PagesApiResponse } from './pageTypes'

export async function listPages(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<PageRow>> {
  const response = await api.get<PagesApiResponse>('/api/v1/admin/pages', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function createPage(values: PagePayload): Promise<PageRow> {
  const response = await api.post<{ data: PageRow }>('/api/v1/admin/pages', values)

  return response.data.data
}

export async function getPage(pageId: number): Promise<PageRow> {
  const response = await api.get<PageApiResponse>(`/api/v1/admin/pages/${pageId}`)

  return response.data.data
}

export async function updatePage(pageId: number, values: PagePayload): Promise<PageRow> {
  const response = await api.put<{ data: PageRow }>(`/api/v1/admin/pages/${pageId}`, values)

  return response.data.data
}

export async function deletePage(pageId: number): Promise<void> {
  await api.delete(`/api/v1/admin/pages/${pageId}`)
}
