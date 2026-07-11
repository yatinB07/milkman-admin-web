import { z } from 'zod'
import type { AdminSelectOption } from '../../components/forms/AdminSelect'
import type {
  SelectOption,
  StoreFormErrors,
  StoreFormTabId,
  StoreFormValues,
  StorePayload,
  StoreValidationField,
} from './storeTypes'

export const storeFormTabs: Array<{ id: StoreFormTabId; label: string }> = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'media', label: 'Media' },
  { id: 'login', label: 'Login' },
  { id: 'categories', label: 'Categories' },
  { id: 'address', label: 'Address' },
  { id: 'service', label: 'Service' },
  { id: 'payout', label: 'Payout' },
]

export const storeValidationFields: StoreValidationField[] = [
  { name: 'title', label: 'Store Name', tab: 'basic' },
  { name: 'rating', label: 'Rating', tab: 'basic' },
  { name: 'mobile', label: 'Mobile number', tab: 'basic' },
  { name: 'slogan', label: 'Slogan Title', tab: 'basic' },
  { name: 'slogan_title', label: 'Slogan Subtitle', tab: 'basic' },
  { name: 'opens_at', label: 'Store Open Time', tab: 'basic' },
  { name: 'closes_at', label: 'Store Close Time', tab: 'basic' },
  { name: 'short_description', label: 'Tags', tab: 'basic' },
  { name: 'content_description', label: 'Short Description', tab: 'basic' },
  { name: 'cancel_policy', label: 'Cancel Policy', tab: 'basic' },
  { name: 'image_path', label: 'Store Logo', tab: 'media' },
  { name: 'cover_image_path', label: 'Store Cover Image', tab: 'media' },
  { name: 'email', label: 'Email Address', tab: 'login' },
  { name: 'password', label: 'Password', tab: 'login', when: (_values, isEditing) => !isEditing },
  { name: 'category_reference', label: 'Store Category', tab: 'categories' },
  { name: 'full_address', label: 'Full Address', tab: 'address' },
  { name: 'pincode', label: 'Pincode', tab: 'address' },
  { name: 'landmark', label: 'Landmark', tab: 'address' },
  { name: 'zone_id', label: 'Select Zone', tab: 'address' },
  { name: 'latitude', label: 'Latitude', tab: 'address' },
  { name: 'longitude', label: 'Longitude', tab: 'address' },
  { name: 'charge_type', label: 'Service Charge Type', tab: 'service' },
  { name: 'delivery_charge', label: 'Service Charge', tab: 'service', when: (values) => values.charge_type === '1' },
  {
    name: 'unit_kilometers',
    label: 'Base Service Distance',
    tab: 'service',
    when: (values) => values.charge_type === '2',
  },
  { name: 'unit_price', label: 'Base Service Charge', tab: 'service', when: (values) => values.charge_type === '2' },
  {
    name: 'additional_price',
    label: 'Extra Service Charge',
    tab: 'service',
    when: (values) => values.charge_type === '2',
  },
  { name: 'store_charge', label: 'Store Charge', tab: 'service' },
  { name: 'minimum_order_amount', label: 'Min.Order Price', tab: 'service' },
  { name: 'commission_percent', label: 'Commission Rate', tab: 'service' },
  { name: 'bank_name', label: 'Bank Name', tab: 'payout' },
  { name: 'ifsc_code', label: 'Bank Code/IFSC', tab: 'payout' },
  { name: 'receipt_name', label: 'Recipient Name', tab: 'payout' },
  { name: 'account_number', label: 'Account Number', tab: 'payout' },
  { name: 'paypal_id', label: 'Paypal ID', tab: 'payout' },
  { name: 'upi_id', label: 'UPI ID', tab: 'payout' },
]

const storeFormSchema = z
  .object({
    title: z.string(),
    image_path: z.string(),
    cover_image_path: z.string(),
    rating: z.string(),
    language_code: z.string(),
    mobile: z.string(),
    slogan: z.string(),
    slogan_title: z.string(),
    opens_at: z.string(),
    closes_at: z.string(),
    is_pickup_enabled: z.boolean(),
    is_active: z.boolean(),
    short_description: z.string(),
    content_description: z.string(),
    cancel_policy: z.string(),
    email: z.string(),
    password: z.string().optional(),
    category_reference: z.string(),
    full_address: z.string(),
    pincode: z.string(),
    landmark: z.string(),
    zone_id: z.string(),
    latitude: z.string(),
    longitude: z.string(),
    charge_type: z.string(),
    delivery_charge: z.string(),
    unit_kilometers: z.string(),
    unit_price: z.string(),
    additional_price: z.string(),
    store_charge: z.string(),
    minimum_order_amount: z.string(),
    commission_percent: z.string(),
    bank_name: z.string(),
    ifsc_code: z.string(),
    receipt_name: z.string(),
    account_number: z.string(),
    paypal_id: z.string(),
    upi_id: z.string(),
  })
  .passthrough()

export function validateStoreFieldErrors(values: StoreFormValues, isEditing: boolean) {
  const errors: StoreFormErrors = {}
  let firstTab: StoreFormTabId | null = null
  const result = storeFormSchema.safeParse(values)

  if (!result.success) {
    for (const issue of result.error.issues) {
      const name = issue.path[0] as keyof StoreFormValues | undefined

      if (name) {
        errors[name] = issue.message
      }
    }
  }

  for (const field of storeValidationFields) {
    if (field.when && !field.when(values, isEditing)) continue
    if (String(values[field.name] ?? '').trim()) continue

    errors[field.name] = `${field.label} is required.`
    firstTab ??= field.tab
  }

  return { errors, firstTab }
}

export function toStoreFormDefaults(store: {
  title?: string | null
  image_path?: string | null
  cover_image_path?: string | null
  rating?: string | number | null
  language_code?: string | null
  mobile?: string | null
  slogan?: string | null
  slogan_title?: string | null
  opens_at?: string | null
  closes_at?: string | null
  is_pickup_enabled?: boolean | null
  is_active?: boolean | null
  short_description?: string | null
  content_description?: string | null
  cancel_policy?: string | null
  email?: string | null
  category_reference?: string | null
  full_address?: string | null
  pincode?: string | null
  landmark?: string | null
  zone_id?: string | number | null
  latitude?: string | number | null
  longitude?: string | number | null
  charge_type?: string | number | null
  delivery_charge?: string | number | null
  unit_kilometers?: string | number | null
  unit_price?: string | number | null
  additional_price?: string | number | null
  store_charge?: string | number | null
  minimum_order_amount?: string | number | null
  commission_percent?: string | number | null
  bank_name?: string | null
  ifsc_code?: string | null
  receipt_name?: string | null
  account_number?: string | null
  paypal_id?: string | null
  upi_id?: string | null
} | null): StoreFormValues {
  return {
    title: store?.title ?? '',
    image_path: store?.image_path ?? '',
    cover_image_path: store?.cover_image_path ?? '',
    rating: stringifyValue(store?.rating ?? ''),
    language_code: store?.language_code ?? '',
    mobile: store?.mobile ?? '',
    slogan: store?.slogan ?? '',
    slogan_title: store?.slogan_title ?? '',
    opens_at: toTimeInput(store?.opens_at),
    closes_at: toTimeInput(store?.closes_at),
    is_pickup_enabled: store?.is_pickup_enabled === false ? false : true,
    is_active: store?.is_active === false ? false : true,
    short_description: store?.short_description ?? '',
    content_description: store?.content_description ?? '',
    cancel_policy: store?.cancel_policy ?? '',
    email: store?.email ?? '',
    password: '',
    category_reference: store?.category_reference ?? '',
    full_address: store?.full_address ?? '',
    pincode: store?.pincode ?? '',
    landmark: store?.landmark ?? '',
    zone_id: stringifyValue(store?.zone_id ?? ''),
    latitude: stringifyValue(store?.latitude ?? ''),
    longitude: stringifyValue(store?.longitude ?? ''),
    charge_type: stringifyValue(store?.charge_type ?? '1'),
    delivery_charge: stringifyValue(store?.delivery_charge ?? ''),
    unit_kilometers: stringifyValue(store?.unit_kilometers ?? ''),
    unit_price: stringifyValue(store?.unit_price ?? ''),
    additional_price: stringifyValue(store?.additional_price ?? ''),
    store_charge: stringifyValue(store?.store_charge ?? ''),
    minimum_order_amount: stringifyValue(store?.minimum_order_amount ?? ''),
    commission_percent: stringifyValue(store?.commission_percent ?? ''),
    bank_name: store?.bank_name ?? '',
    ifsc_code: store?.ifsc_code ?? '',
    receipt_name: store?.receipt_name ?? '',
    account_number: store?.account_number ?? '',
    paypal_id: store?.paypal_id ?? '',
    upi_id: store?.upi_id ?? '',
  }
}

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
