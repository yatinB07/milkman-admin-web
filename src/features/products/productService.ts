import type { AdminSelectOption } from '../../components/forms/AdminSelect'
import type { ProductFormValues, ProductPayload, StoreCategoryOption, StoreOption } from './productTypes'

export function toStoreSelectOptions(stores: StoreOption[] = []): AdminSelectOption[] {
  return stores.map((store) => ({ label: store.title, value: String(store.id) }))
}

export function toStoreCategorySelectOptions(
  categories: StoreCategoryOption[] = [],
  storeId: string,
): AdminSelectOption[] {
  return categories
    .filter((category) => !storeId || String(category.store_id) === storeId)
    .map((category) => ({ label: category.title, value: String(category.id) }))
}

export function toProductPayload(values: ProductFormValues): ProductPayload {
  return {
    store_id: Number(values.store_id),
    store_category_id: Number(values.store_category_id),
    title: values.title,
    image_path: values.image_path.trim() || null,
    description: values.description.trim() || null,
    is_active: values.is_active,
  }
}
