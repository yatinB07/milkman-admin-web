import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type {
  DeliveryOptionApiResponse,
  DeliveryOptionPayload,
  DeliveryOptionRow,
  DeliveryOptionsApiResponse,
  OptionsApiResponse,
  StoreOption,
} from './deliveryOptionTypes'

export async function listDeliveryOptions(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<DeliveryOptionRow>> {
  const response = await api.get<DeliveryOptionsApiResponse>('/api/v1/admin/delivery-options', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function listDeliveryOptionStores(): Promise<StoreOption[]> {
  const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createDeliveryOption(values: DeliveryOptionPayload): Promise<DeliveryOptionRow> {
  const response = await api.post<{ data: DeliveryOptionRow }>('/api/v1/admin/delivery-options', values)

  return response.data.data
}

export async function getDeliveryOption(deliveryOptionId: number): Promise<DeliveryOptionRow> {
  const response = await api.get<DeliveryOptionApiResponse>(`/api/v1/admin/delivery-options/${deliveryOptionId}`)

  return response.data.data
}

export async function updateDeliveryOption(
  deliveryOptionId: number,
  values: DeliveryOptionPayload,
): Promise<DeliveryOptionRow> {
  const response = await api.put<{ data: DeliveryOptionRow }>(
    `/api/v1/admin/delivery-options/${deliveryOptionId}`,
    values,
  )

  return response.data.data
}

export async function deleteDeliveryOption(deliveryOptionId: number): Promise<void> {
  await api.delete(`/api/v1/admin/delivery-options/${deliveryOptionId}`)
}
