import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { SelectField, type SelectFieldOption } from '../../components/forms/SelectField'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { DeliveryOptionFormValues, DeliveryOptionRow } from './deliveryOptionTypes'

type DeliveryOptionFormProps = {
  option: DeliveryOptionRow | null
  storeOptions: SelectFieldOption[]
  formErrors: Partial<Record<'store_id' | 'title' | 'delivery_days', string>>
  optionError: boolean
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: DeliveryOptionFormValues) => void
}

export function DeliveryOptionForm({
  option,
  storeOptions,
  formErrors,
  optionError,
  isSaving,
  onCancel,
  onSubmit,
}: DeliveryOptionFormProps) {
  const [storeId, setStoreId] = useState(option ? String(option.store_id) : '')
  const [title, setTitle] = useState(option?.title ?? '')
  const [deliveryDays, setDeliveryDays] = useState(option ? String(option.delivery_days) : '')
  const [status, setStatus] = useState(option?.is_active === false ? '0' : '1')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmit({
      store_id: storeId,
      title,
      delivery_days: deliveryDays,
      is_active: status === '1',
    })
  }

  return (
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="Delivery Option Information" columns={2}>
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
          <FieldLabel label="Title" required />
          <Input
            value={title}
            aria-invalid={Boolean(formErrors.title)}
            placeholder="Enter delivery option title"
            onChange={(event) => setTitle(event.target.value)}
          />
          {formErrors.title ? <small className="field-error">{formErrors.title}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Delivery Days" required />
          <Input
            min={0}
            step={1}
            type="number"
            value={deliveryDays}
            aria-invalid={Boolean(formErrors.delivery_days)}
            placeholder="Enter delivery days"
            onChange={(event) => setDeliveryDays(event.target.value)}
          />
          {formErrors.delivery_days ? <small className="field-error">{formErrors.delivery_days}</small> : null}
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
          {isSaving ? 'Saving...' : option ? 'Save Delivery Option' : 'Add Delivery Option'}
        </Button>
      </div>
    </form>
  )
}
