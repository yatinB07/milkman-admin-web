import type { SelectFieldOption } from '../../components/forms/SelectField'
import type { TimeSlotFormValues, TimeSlotPayload, StoreOption } from './timeSlotTypes'

export function toStoreSelectOptions(stores: StoreOption[] = []): SelectFieldOption[] {
  return stores.map((store) => ({ label: store.title, value: String(store.id) }))
}

export function toTimeSlotPayload(values: TimeSlotFormValues): TimeSlotPayload {
  return {
    store_id: Number(values.store_id),
    starts_at: toApiTime(values.starts_at),
    ends_at: toApiTime(values.ends_at),
    is_active: values.is_active,
  }
}

export function toInputTime(value: string): string {
  return value.slice(0, 5)
}

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}
