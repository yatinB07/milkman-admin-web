import type { PageFormValues, PagePayload } from './pageTypes'

export function toPagePayload(values: PageFormValues): PagePayload {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    is_active: values.is_active,
  }
}
