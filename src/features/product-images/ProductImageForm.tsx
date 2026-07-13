import { type FormEvent, useState } from 'react'
import { Button } from '../../components/common'
import { FilePickerField } from '../../components/forms/FilePickerField'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { SelectField, type SelectFieldOption } from '../../components/forms/SelectField'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { ProductImageFormValues, ProductImageRow } from './productImageTypes'

type ProductImageFormProps = {
  image: ProductImageRow | null
  storeOptions: SelectFieldOption[]
  productOptions: SelectFieldOption[]
  formErrors: Partial<Record<'store_id' | 'product_id' | 'image_path', string>>
  optionError: boolean
  isSaving: boolean
  onStoreChange: (storeId: string) => void
  onCancel: () => void
  onSubmit: (values: ProductImageFormValues) => void
}

export function ProductImageForm({
  image,
  storeOptions,
  productOptions,
  formErrors,
  optionError,
  isSaving,
  onStoreChange,
  onCancel,
  onSubmit,
}: ProductImageFormProps) {
  const [storeId, setStoreId] = useState(image ? String(image.store_id) : '')
  const [productId, setProductId] = useState(image ? String(image.product_id) : '')
  const [imagePath, setImagePath] = useState(image?.image_path ?? '')
  const [status, setStatus] = useState(image?.is_active === false ? '0' : '1')

  function handleStoreChange(nextStoreId: string) {
    setStoreId(nextStoreId)
    setProductId('')
    onStoreChange(nextStoreId)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmit({
      store_id: storeId,
      product_id: productId,
      image_path: imagePath,
      is_active: status === '1',
    })
  }

  return (
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="Product Image Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Store" required />
          <SelectField
            options={storeOptions}
            placeholder="Search and select store"
            value={storeId}
            onChange={handleStoreChange}
            hasError={Boolean(formErrors.store_id || optionError)}
          />
          {formErrors.store_id || optionError ? (
            <small className="field-error">{formErrors.store_id ?? 'Store or product options could not be loaded.'}</small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Product" required />
          <SelectField
            options={productOptions}
            placeholder={storeId ? 'Search and select product' : 'Select store first'}
            value={productId}
            onChange={setProductId}
            hasError={Boolean(formErrors.product_id)}
          />
          {formErrors.product_id ? <small className="field-error">{formErrors.product_id}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <SelectField isSearchable={false} options={publishStatusSelectOptions} value={status} onChange={setStatus} />
        </label>

        <label className="form-field">
          <FieldLabel label="Product Image" required />
          <FilePickerField
            name="image_path"
            directory="products"
            label="Product image"
            required
            value={imagePath}
            onChange={setImagePath}
          />
          {formErrors.image_path ? <small className="field-error">{formErrors.image_path}</small> : null}
        </label>
      </FormSection>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : image ? 'Save Product Image' : 'Add Product Image'}
        </Button>
      </div>
    </form>
  )
}
