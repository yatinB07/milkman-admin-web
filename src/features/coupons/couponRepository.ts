import { api } from '../../lib/api'
import { normalizePaginationMeta, toApiListParams, type PaginatedResponse } from '../../lib/apiTypes'
import type {
  CouponApiResponse,
  CouponPayload,
  CouponRow,
  CouponsApiResponse,
  OptionsApiResponse,
  StoreOption,
} from './couponTypes'

export async function listCoupons(query: {
  page: number
  perPage: number
  search: string
  status?: string
}): Promise<PaginatedResponse<CouponRow>> {
  const response = await api.get<CouponsApiResponse>('/api/v1/admin/coupons', {
    params: toApiListParams({
      ...query,
      filters: { is_active: query.status === 'all' ? undefined : query.status === 'active' },
    }),
  })

  return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
}

export async function listCouponStores(): Promise<StoreOption[]> {
  const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
    params: toApiListParams({ perPage: 100 }),
  })

  return response.data.data
}

export async function createCoupon(values: CouponPayload): Promise<CouponRow> {
  const response = await api.post<{ data: CouponRow }>('/api/v1/admin/coupons', values)

  return response.data.data
}

export async function getCoupon(couponId: number): Promise<CouponRow> {
  const response = await api.get<CouponApiResponse>(`/api/v1/admin/coupons/${couponId}`)

  return response.data.data
}

export async function updateCoupon(couponId: number, values: CouponPayload): Promise<CouponRow> {
  const response = await api.put<{ data: CouponRow }>(`/api/v1/admin/coupons/${couponId}`, values)

  return response.data.data
}

export async function deleteCoupon(couponId: number): Promise<void> {
  await api.delete(`/api/v1/admin/coupons/${couponId}`)
}
