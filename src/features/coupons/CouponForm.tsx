import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { FilePickerField } from '../../components/forms/FilePickerField'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { RichTextField } from '../../components/forms/RichTextField'
import { SelectField, type SelectFieldOption } from '../../components/forms/SelectField'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { CouponFormValues, CouponRow } from './couponTypes'

type CouponFormErrors = Partial<
  Record<'store_id' | 'title' | 'code' | 'minimum_amount' | 'value' | 'expires_at', string>
>

type CouponFormProps = {
  coupon: CouponRow | null
  storeOptions: SelectFieldOption[]
  formErrors: CouponFormErrors
  optionError: boolean
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: CouponFormValues) => void
}

export function CouponForm({
  coupon,
  storeOptions,
  formErrors,
  optionError,
  isSaving,
  onCancel,
  onSubmit,
}: CouponFormProps) {
  const [storeId, setStoreId] = useState(coupon ? String(coupon.store_id) : '')
  const [imagePath, setImagePath] = useState(coupon?.image_path ?? '')
  const [title, setTitle] = useState(coupon?.title ?? '')
  const [code, setCode] = useState(coupon?.code ?? '')
  const [subtitle, setSubtitle] = useState(coupon?.subtitle ?? '')
  const [expiresAt, setExpiresAt] = useState(coupon?.expires_at ?? '')
  const [minimumAmount, setMinimumAmount] = useState(coupon ? String(coupon.minimum_amount) : '')
  const [value, setValue] = useState(coupon ? String(coupon.value) : '')
  const [description, setDescription] = useState(coupon?.description ?? '')
  const [status, setStatus] = useState(coupon?.is_active === false ? '0' : '1')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmit({
      store_id: storeId,
      image_path: imagePath,
      title,
      code,
      subtitle,
      expires_at: expiresAt,
      minimum_amount: minimumAmount,
      value,
      description,
      is_active: status === '1',
    })
  }

  return (
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="Coupon Information" columns={2}>
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

        <label className="form-field">
          <FieldLabel label="Title" required />
          <Input
            value={title}
            maxLength={255}
            aria-invalid={Boolean(formErrors.title)}
            placeholder="Enter coupon title"
            onChange={(event) => setTitle(event.target.value)}
          />
          {formErrors.title ? <small className="field-error">{formErrors.title}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Code" required />
          <Input
            value={code}
            maxLength={32}
            aria-invalid={Boolean(formErrors.code)}
            placeholder="Enter coupon code"
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
          {formErrors.code ? <small className="field-error">{formErrors.code}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Subtitle" />
          <Input
            value={subtitle}
            maxLength={255}
            placeholder="Enter coupon subtitle"
            onChange={(event) => setSubtitle(event.target.value)}
          />
        </label>

        <label className="form-field">
          <FieldLabel label="Expires At" />
          <Input
            type="date"
            value={expiresAt}
            aria-invalid={Boolean(formErrors.expires_at)}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
          {formErrors.expires_at ? <small className="field-error">{formErrors.expires_at}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Minimum Amount" required />
          <Input
            min={0}
            step="0.01"
            type="number"
            value={minimumAmount}
            aria-invalid={Boolean(formErrors.minimum_amount)}
            placeholder="Enter minimum order amount"
            onChange={(event) => setMinimumAmount(event.target.value)}
          />
          {formErrors.minimum_amount ? <small className="field-error">{formErrors.minimum_amount}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Coupon Value" required />
          <Input
            min={0}
            step="0.01"
            type="number"
            value={value}
            aria-invalid={Boolean(formErrors.value)}
            placeholder="Enter discount value"
            onChange={(event) => setValue(event.target.value)}
          />
          {formErrors.value ? <small className="field-error">{formErrors.value}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Coupon Image" />
          <FilePickerField
            name="image_path"
            directory="coupons"
            label="Coupon image"
            value={imagePath}
            onChange={setImagePath}
          />
        </label>

        <label className="form-field span-2">
          <FieldLabel label="Description" />
          <RichTextField
            name="description"
            value={description}
            placeholder="Enter coupon description"
            helpText="Optional customer-facing coupon copy."
            onChange={setDescription}
          />
        </label>
      </FormSection>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : coupon ? 'Save Coupon' : 'Add Coupon'}
        </Button>
      </div>
    </form>
  )
}
