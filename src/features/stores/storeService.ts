import type { AdminSelectOption } from '../../components/forms/AdminSelect'
import type { SelectOption, StoreFormValues, StorePayload } from './storeTypes'

export function toStorePayload(values: StoreFormValues, isEditing: boolean): StorePayload {
  const payload: StorePayload = {
    title: values.title,
    zone_id: nullableNumber(values.zone_id),
    image_path: values.image_path,
    cover_image_path: values.cover_image_path,
    rating: nullableNumber(values.rating),
    slogan: values.slogan,
    slogan_title: values.slogan_title,
    language_code: nullableString(values.language_code),
    category_reference: values.category_reference,
    email: values.email,
    country_code: null,
    mobile: values.mobile,
    full_address: values.full_address,
    pincode: values.pincode,
    landmark: values.landmark,
    short_description: values.short_description,
    content_description: values.content_description,
    latitude: nullableNumber(values.latitude),
    longitude: nullableNumber(values.longitude),
    store_charge: nullableNumber(values.store_charge),
    delivery_charge: nullableNumber(values.delivery_charge),
    minimum_order_amount: nullableNumber(values.minimum_order_amount),
    commission_percent: nullableNumber(values.commission_percent),
    opens_at: toApiTime(values.opens_at),
    closes_at: toApiTime(values.closes_at),
    is_pickup_enabled: values.is_pickup_enabled,
    is_active: values.is_active,
    registration_status: 1,
    charge_type: nullableNumber(values.charge_type),
    unit_kilometers: nullableNumber(values.unit_kilometers),
    unit_price: nullableNumber(values.unit_price),
    additional_price: nullableNumber(values.additional_price),
    bank_name: values.bank_name,
    ifsc_code: values.ifsc_code,
    receipt_name: values.receipt_name,
    account_number: values.account_number,
    paypal_id: values.paypal_id,
    upi_id: values.upi_id,
    cancel_policy: values.cancel_policy,
  }

  if (!isEditing || values.password) {
    payload.password = values.password ?? ''
  }

  return payload
}

export function splitCategoryReference(value?: string | null) {
  return value
    ? value
        .split(',')
        .map((category) => category.trim())
        .filter(Boolean)
    : []
}

export function toSelectOptions(options?: SelectOption[]): AdminSelectOption[] {
  return options?.map((option) => ({ label: option.title, value: String(option.id) })) ?? []
}

export function serialNumber(meta: { from: number | null }, index: number) {
  return (meta.from || 1) + index
}

export function stringifyValue(value: string | number | null) {
  return value === null ? '' : String(value)
}

export function toTimeInput(value?: string | null) {
  return value ? value.slice(0, 5) : ''
}

function nullableString(value: string) {
  return value.trim() === '' ? null : value.trim()
}

function nullableNumber(value: string) {
  return value === '' ? null : Number(value)
}

function toApiTime(value: string) {
  return value ? `${value}:00` : null
}
