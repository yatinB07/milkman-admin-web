import type { SelectFieldOption } from '../../components/forms/SelectField'
import type { CouponFormValues, CouponPayload, StoreOption } from './couponTypes'

export function toStoreSelectOptions(stores: StoreOption[] = []): SelectFieldOption[] {
  return stores.map((store) => ({ label: store.title, value: String(store.id) }))
}

export function toCouponPayload(values: CouponFormValues): CouponPayload {
  return {
    store_id: Number(values.store_id),
    image_path: values.image_path.trim() || null,
    title: values.title.trim(),
    code: values.code.trim(),
    subtitle: values.subtitle.trim() || null,
    expires_at: values.expires_at || null,
    minimum_amount: Number(values.minimum_amount),
    value: Number(values.value),
    description: values.description.trim() || null,
    is_active: values.is_active,
  }
}
