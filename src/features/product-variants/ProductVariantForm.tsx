import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { AdminSelect, type AdminSelectOption } from '../../components/forms/AdminSelect'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import type { ProductVariantFormValues, ProductVariantRow } from './productVariantTypes'

type ProductVariantFormProps = {
  variant: ProductVariantRow | null
  storeOptions: AdminSelectOption[]
  productOptions: AdminSelectOption[]
  formErrors: Partial<
    Record<'store_id' | 'product_id' | 'title' | 'discount' | 'normal_price' | 'subscribe_price', string>
  >
  optionError: boolean
  isSaving: boolean
  onStoreChange: (storeId: string) => void
  onCancel: () => void
  onSubmit: (values: ProductVariantFormValues) => void
}

const yesNoOptions: AdminSelectOption[] = [
  { label: 'Yes', value: '1' },
  { label: 'No', value: '0' },
]

export function ProductVariantForm({
  variant,
  storeOptions,
  productOptions,
  formErrors,
  optionError,
  isSaving,
  onStoreChange,
  onCancel,
  onSubmit,
}: ProductVariantFormProps) {
  const [storeId, setStoreId] = useState(variant ? String(variant.store_id) : '')
  const [productId, setProductId] = useState(variant ? String(variant.product_id) : '')
  const [stock, setStock] = useState(variant?.is_out_of_stock ? '1' : '0')
  const [subscriptionRequired, setSubscriptionRequired] = useState(variant?.is_subscription_required === false ? '0' : '1')

  function handleStoreChange(nextStoreId: string) {
    setStoreId(nextStoreId)
    setProductId('')
    onStoreChange(nextStoreId)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    onSubmit({
      store_id: storeId,
      product_id: productId,
      title: String(form.get('title') ?? '').trim(),
      normal_price: String(form.get('normal_price') ?? '').trim(),
      subscribe_price: String(form.get('subscribe_price') ?? '').trim(),
      discount: String(form.get('discount') ?? '0').trim(),
      is_out_of_stock: stock === '1',
      is_subscription_required: subscriptionRequired === '1',
    })
  }

  return (
    <form className="store-form" onInputCapture={dirtyFormStore.markDirty} onChangeCapture={dirtyFormStore.markDirty} onSubmit={handleSubmit}>
      <FormSection title="Variant Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Store" required />
          <AdminSelect
            options={storeOptions}
            placeholder="Search and select store"
            value={storeId}
            onChange={handleStoreChange}
            hasError={Boolean(formErrors.store_id || optionError)}
          />
          {formErrors.store_id || optionError ? (
            <small className="field-error">
              {formErrors.store_id ?? 'Store or product options could not be loaded.'}
            </small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Product" required />
          <AdminSelect
            options={productOptions}
            placeholder={storeId ? 'Search and select product' : 'Select store first'}
            value={productId}
            onChange={setProductId}
            hasError={Boolean(formErrors.product_id)}
          />
          {formErrors.product_id ? <small className="field-error">{formErrors.product_id}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Product Type" required />
          <Input
            name="title"
            maxLength={255}
            aria-invalid={Boolean(formErrors.title)}
            defaultValue={variant?.title ?? ''}
          />
          {formErrors.title ? <small className="field-error">{formErrors.title}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Discount %" required />
          <Input
            name="discount"
            type="number"
            min="0"
            step="any"
            aria-invalid={Boolean(formErrors.discount)}
            defaultValue={variant?.discount ?? 0}
          />
          {formErrors.discount ? <small className="field-error">{formErrors.discount}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Product Price" required />
          <Input
            name="normal_price"
            type="number"
            min="0"
            step="any"
            aria-invalid={Boolean(formErrors.normal_price)}
            defaultValue={variant?.normal_price ?? ''}
          />
          {formErrors.normal_price ? <small className="field-error">{formErrors.normal_price}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Subscription Price" required />
          <Input
            name="subscribe_price"
            type="number"
            min="0"
            step="any"
            aria-invalid={Boolean(formErrors.subscribe_price)}
            defaultValue={variant?.subscribe_price ?? ''}
          />
          {formErrors.subscribe_price ? (
            <small className="field-error">{formErrors.subscribe_price}</small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Out Of Stock?" required />
          <AdminSelect isSearchable={false} options={yesNoOptions} value={stock} onChange={setStock} />
        </label>

        <label className="form-field">
          <FieldLabel label="Subscription Required?" required />
          <AdminSelect
            isSearchable={false}
            options={yesNoOptions}
            value={subscriptionRequired}
            onChange={setSubscriptionRequired}
          />
        </label>
      </FormSection>

      <div className="modal-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : variant ? 'Save Variant' : 'Add Variant'}
        </Button>
      </div>
    </form>
  )
}
