import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { SelectField, type SelectFieldOption } from '../../components/forms/SelectField'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { TimeSlotFormValues, TimeSlotRow } from './timeSlotTypes'

type TimeSlotFormProps = {
  option: TimeSlotRow | null
  storeOptions: SelectFieldOption[]
  formErrors: Partial<Record<'store_id' | 'starts_at' | 'ends_at', string>>
  optionError: boolean
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: TimeSlotFormValues) => void
}

export function TimeSlotForm({
  option,
  storeOptions,
  formErrors,
  optionError,
  isSaving,
  onCancel,
  onSubmit,
}: TimeSlotFormProps) {
  const [storeId, setStoreId] = useState(option ? String(option.store_id) : '')
  const [startsAt, setStartsAt] = useState(option?.starts_at.slice(0, 5) ?? '')
  const [endsAt, setEndsAt] = useState(option?.ends_at.slice(0, 5) ?? '')
  const [status, setStatus] = useState(option?.is_active === false ? '0' : '1')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmit({
      store_id: storeId,
      starts_at: startsAt,
      ends_at: endsAt,
      is_active: status === '1',
    })
  }

  return (
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="Time Slot Information" columns={2}>
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
          <FieldLabel label="Start Time" required />
          <Input
            type="time"
            value={startsAt}
            aria-invalid={Boolean(formErrors.starts_at)}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          {formErrors.starts_at ? <small className="field-error">{formErrors.starts_at}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="End Time" required />
          <Input
            type="time"
            value={endsAt}
            aria-invalid={Boolean(formErrors.ends_at)}
            onChange={(event) => setEndsAt(event.target.value)}
          />
          {formErrors.ends_at ? <small className="field-error">{formErrors.ends_at}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <SelectField isSearchable={false} options={publishStatusSelectOptions} value={status} onChange={setStatus} />
        </label>
      </FormSection>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : option ? 'Save Time Slot' : 'Add Time Slot'}
        </Button>
      </div>
    </form>
  )
}
