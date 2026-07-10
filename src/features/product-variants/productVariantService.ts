import type { AdminSelectOption } from '../../components/forms/AdminSelect'
import type {
  ProductOption,
  ProductVariantFormValues,
  ProductVariantPayload,
  StoreOption,
} from './productVariantTypes'

export function toStoreSelectOptions(stores: StoreOption[] = []): AdminSelectOption[] {
  return stores.map((store) => ({ label: store.title, value: String(store.id) }))
}

export function toProductSelectOptions(products: ProductOption[] = [], storeId: string): AdminSelectOption[] {
  return products
    .filter((product) => !storeId || String(product.store_id) === storeId)
    .map((product) => ({ label: product.title, value: String(product.id) }))
}

export function toProductVariantPayload(values: ProductVariantFormValues): ProductVariantPayload {
  return {
    store_id: Number(values.store_id),
    product_id: Number(values.product_id),
    title: values.title,
    normal_price: Number(values.normal_price),
    subscribe_price: Number(values.subscribe_price),
    discount: Number(values.discount || 0),
    is_out_of_stock: values.is_out_of_stock,
    is_subscription_required: values.is_subscription_required,
  }
}

export function formatMoney(value: string | number) {
  return Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })
}
