import { type FormEvent, type ReactNode, useState } from 'react'
import { AdminSelect, type AdminSelectOption } from '../../components/forms/AdminSelect'
import type { ProductVariantFormValues, ProductVariantRow } from './productVariantTypes'

type ProductVariantFormProps = {
  variant: ProductVariantRow | null
  storeOptions: AdminSelectOption[]
  productOptions: AdminSelectOption[]
  formError: string | null
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
  formError,
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
    <form className="store-form" onSubmit={handleSubmit}>
      <FormSection title="Variant Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Store" required />
          <AdminSelect
            options={storeOptions}
            placeholder="Search and select store"
            value={storeId}
            onChange={handleStoreChange}
          />
        </label>

        <label className="form-field">
          <FieldLabel label="Product" required />
          <AdminSelect
            options={productOptions}
            placeholder={storeId ? 'Search and select product' : 'Select store first'}
            value={productId}
            onChange={setProductId}
          />
        </label>

        <label className="form-field">
          <FieldLabel label="Product Type" required />
          <input name="title" maxLength={255} defaultValue={variant?.title ?? ''} />
        </label>

        <label className="form-field">
          <FieldLabel label="Discount %" required />
          <input name="discount" type="number" min="0" step="any" defaultValue={variant?.discount ?? 0} />
        </label>

        <label className="form-field">
          <FieldLabel label="Product Price" required />
          <input name="normal_price" type="number" min="0" step="any" defaultValue={variant?.normal_price ?? ''} />
        </label>

        <label className="form-field">
          <FieldLabel label="Subscription Price" required />
          <input
            name="subscribe_price"
            type="number"
            min="0"
            step="any"
            defaultValue={variant?.subscribe_price ?? ''}
          />
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

      {formError ? <div className="form-error">{formError}</div> : null}
      {optionError ? <div className="form-error">Store or product options could not be loaded.</div> : null}

      <div className="modal-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-button is-compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : variant ? 'Save Variant' : 'Add Variant'}
        </button>
      </div>
    </form>
  )
}

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <span>
      {label} {required ? <span className="required-mark" aria-hidden="true">*</span> : null}
    </span>
  )
}

function FormSection({ title, columns = 2, children }: { title: string; columns?: 1 | 2 | 3; children: ReactNode }) {
  return (
    <section className="store-form-section">
      <h4>{title}</h4>
      <div className="form-grid" data-columns={columns}>
        {children}
      </div>
    </section>
  )
}
