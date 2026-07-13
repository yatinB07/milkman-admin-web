import type { SelectFieldOption } from '../../components/forms/SelectField'
import type { ProductImageFormValues, ProductImagePayload, ProductOption, StoreOption } from './productImageTypes'

export function toStoreSelectOptions(stores: StoreOption[] = []): SelectFieldOption[] {
  return stores.map((store) => ({ label: store.title, value: String(store.id) }))
}

export function toProductSelectOptions(products: ProductOption[] = [], storeId: string): SelectFieldOption[] {
  return products
    .filter((product) => !storeId || String(product.store_id) === storeId)
    .map((product) => ({ label: product.title, value: String(product.id) }))
}

export function toProductImagePayload(values: ProductImageFormValues): ProductImagePayload {
  return {
    store_id: Number(values.store_id),
    product_id: Number(values.product_id),
    image_path: values.image_path.trim(),
    is_active: values.is_active,
  }
}
