import type { CategoryFormValues, CategoryPayload } from './categoryTypes'

export function toCategoryPayload(values: CategoryFormValues): CategoryPayload {
  return {
    title: values.title,
    image_path: nullableString(values.image_path),
    cover_path: nullableString(values.cover_path),
    is_active: values.is_active,
  }
}

function nullableString(value: string) {
  return value.trim() === '' ? null : value.trim()
}
