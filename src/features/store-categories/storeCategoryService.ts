import type { AdminSelectOption } from '../../components/forms/AdminSelect'
import type { StoreCategoryFormValues, StoreCategoryPayload, StoreOption } from './storeCategoryTypes'

export function toStoreOptions(stores: StoreOption[] = []): AdminSelectOption[] {
  return stores.map((store) => ({ label: store.title, value: String(store.id) }))
}

export function toStoreCategoryPayload(values: StoreCategoryFormValues): StoreCategoryPayload {
  return {
    store_id: Number(values.store_id),
    title: values.title,
    image_path: values.image_path.trim() || null,
    is_active: values.is_active,
  }
}
