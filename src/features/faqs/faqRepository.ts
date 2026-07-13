import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type {
  FaqApiResponse,
  FaqPayload,
  FaqRow,
  FaqsApiResponse,
  OptionsApiResponse,
  StoreOption,
} from './faqTypes'

export async function listFaqs(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<FaqRow>> {
  const response = await api.get<FaqsApiResponse>('/api/v1/admin/faqs', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function listFaqStores(): Promise<StoreOption[]> {
  const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createFaq(values: FaqPayload): Promise<FaqRow> {
  const response = await api.post<{ data: FaqRow }>('/api/v1/admin/faqs', values)

  return response.data.data
}

export async function getFaq(faqId: number): Promise<FaqRow> {
  const response = await api.get<FaqApiResponse>(`/api/v1/admin/faqs/${faqId}`)

  return response.data.data
}

export async function updateFaq(faqId: number, values: FaqPayload): Promise<FaqRow> {
  const response = await api.put<{ data: FaqRow }>(`/api/v1/admin/faqs/${faqId}`, values)

  return response.data.data
}

export async function deleteFaq(faqId: number): Promise<void> {
  await api.delete(`/api/v1/admin/faqs/${faqId}`)
}
