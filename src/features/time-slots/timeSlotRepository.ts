import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type {
  TimeSlotApiResponse,
  TimeSlotPayload,
  TimeSlotRow,
  TimeSlotsApiResponse,
  OptionsApiResponse,
  StoreOption,
} from './timeSlotTypes'

export async function listTimeSlots(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<TimeSlotRow>> {
  const response = await api.get<TimeSlotsApiResponse>('/api/v1/admin/time-slots', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function listTimeSlotStores(): Promise<StoreOption[]> {
  const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createTimeSlot(values: TimeSlotPayload): Promise<TimeSlotRow> {
  const response = await api.post<{ data: TimeSlotRow }>('/api/v1/admin/time-slots', values)

  return response.data.data
}

export async function getTimeSlot(timeSlotId: number): Promise<TimeSlotRow> {
  const response = await api.get<TimeSlotApiResponse>(`/api/v1/admin/time-slots/${timeSlotId}`)

  return response.data.data
}

export async function updateTimeSlot(
  timeSlotId: number,
  values: TimeSlotPayload,
): Promise<TimeSlotRow> {
  const response = await api.put<{ data: TimeSlotRow }>(
    `/api/v1/admin/time-slots/${timeSlotId}`,
    values,
  )

  return response.data.data
}

export async function deleteTimeSlot(timeSlotId: number): Promise<void> {
  await api.delete(`/api/v1/admin/time-slots/${timeSlotId}`)
}
