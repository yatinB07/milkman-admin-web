import type { SelectFieldOption } from '../../components/forms/SelectField'
import type { DeliveryOptionFormValues, DeliveryOptionPayload, StoreOption } from './deliveryOptionTypes'

export function toStoreSelectOptions(stores: StoreOption[] = []): SelectFieldOption[] {
  return stores.map((store) => ({ label: store.title, value: String(store.id) }))
}

export function toDeliveryOptionPayload(values: DeliveryOptionFormValues): DeliveryOptionPayload {
  return {
    store_id: Number(values.store_id),
    title: values.title.trim(),
    delivery_days: Number(values.delivery_days),
    is_active: values.is_active,
  }
}
