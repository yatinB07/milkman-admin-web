import type { SelectFieldOption } from '../../components/forms/SelectField'
import type { FaqFormValues, FaqPayload, StoreOption } from './faqTypes'

export function toStoreSelectOptions(stores: StoreOption[] = []): SelectFieldOption[] {
  return stores.map((store) => ({ label: store.title, value: String(store.id) }))
}

export function toFaqPayload(values: FaqFormValues): FaqPayload {
  return {
    store_id: Number(values.store_id),
    question: values.question.trim(),
    answer: values.answer.trim(),
    is_active: values.is_active,
  }
}
