import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { RichTextField } from '../../components/forms/RichTextField'
import { SelectField, type SelectFieldOption } from '../../components/forms/SelectField'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { FaqFormValues, FaqRow } from './faqTypes'

type FaqFormProps = {
  faq: FaqRow | null
  storeOptions: SelectFieldOption[]
  formErrors: Partial<Record<'store_id' | 'question' | 'answer', string>>
  optionError: boolean
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: FaqFormValues) => void
}

export function FaqForm({
  faq,
  storeOptions,
  formErrors,
  optionError,
  isSaving,
  onCancel,
  onSubmit,
}: FaqFormProps) {
  const [storeId, setStoreId] = useState(faq ? String(faq.store_id) : '')
  const [question, setQuestion] = useState(faq?.question ?? '')
  const [answer, setAnswer] = useState(faq?.answer ?? '')
  const [status, setStatus] = useState(faq?.is_active === false ? '0' : '1')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmit({
      store_id: storeId,
      question,
      answer,
      is_active: status === '1',
    })
  }

  return (
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="FAQ Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Store" required />
          <SelectField
            options={storeOptions}
            placeholder="Search and select store"
            value={storeId}
            onChange={setStoreId}
            hasError={Boolean(formErrors.store_id || optionError)}
          />
          {formErrors.store_id || optionError ? (
            <small className="field-error">{formErrors.store_id ?? 'Store options could not be loaded.'}</small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <SelectField isSearchable={false} options={publishStatusSelectOptions} value={status} onChange={setStatus} />
        </label>

        <label className="form-field span-2">
          <FieldLabel label="Question" required />
          <Input
            value={question}
            aria-invalid={Boolean(formErrors.question)}
            placeholder="Enter question"
            onChange={(event) => setQuestion(event.target.value)}
          />
          {formErrors.question ? <small className="field-error">{formErrors.question}</small> : null}
        </label>

        <label className="form-field span-2">
          <FieldLabel label="Answer" required />
          <RichTextField
            name="answer"
            value={answer}
            placeholder="Enter answer"
            helpText="Customer-facing FAQ answer."
            onChange={setAnswer}
          />
          {formErrors.answer ? <small className="field-error">{formErrors.answer}</small> : null}
        </label>
      </FormSection>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : faq ? 'Save FAQ' : 'Add FAQ'}
        </Button>
      </div>
    </form>
  )
}
