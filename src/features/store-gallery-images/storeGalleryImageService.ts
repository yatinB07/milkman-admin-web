import type { SelectFieldOption } from '../../components/forms/SelectField'
import type { StoreGalleryImageFormValues, StoreGalleryImagePayload, StoreOption } from './storeGalleryImageTypes'

export function toStoreSelectOptions(stores: StoreOption[] = []): SelectFieldOption[] {
  return stores.map((store) => ({ label: store.title, value: String(store.id) }))
}

export function toStoreGalleryImagePayload(values: StoreGalleryImageFormValues): StoreGalleryImagePayload {
  return {
    store_id: Number(values.store_id),
    image_path: values.image_path.trim(),
    is_active: values.is_active,
  }
}
