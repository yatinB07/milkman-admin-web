import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { FilePickerField } from '../../components/forms/FilePickerField'
import { AdminRichTextEditor } from '../../components/forms/AdminRichTextEditor'
import { SelectField, type SelectFieldOption } from '../../components/forms/SelectField'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { ProductFormValues, ProductRow } from './productTypes'

type ProductFormProps = {
  product: ProductRow | null
  storeOptions: SelectFieldOption[]
  categoryOptions: SelectFieldOption[]
  formErrors: Partial<Record<'store_id' | 'store_category_id' | 'title', string>>
  optionError: boolean
  isSaving: boolean
  onStoreChange: (storeId: string) => void
  onCancel: () => void
  onSubmit: (values: ProductFormValues) => void
}

export function ProductForm({
  product,
  storeOptions,
  categoryOptions,
  formErrors,
  optionError,
  isSaving,
  onStoreChange,
  onCancel,
  onSubmit,
}: ProductFormProps) {
  const [storeId, setStoreId] = useState(product ? String(product.store_id) : '')
  const [categoryId, setCategoryId] = useState(product ? String(product.store_category_id) : '')
  const [status, setStatus] = useState(product?.is_active === false ? '0' : '1')
  const [imagePath, setImagePath] = useState(product?.image_path ?? '')
  const [description, setDescription] = useState(product?.description ?? '')

  function handleStoreChange(nextStoreId: string) {
    setStoreId(nextStoreId)
    setCategoryId('')
    onStoreChange(nextStoreId)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    onSubmit({
      store_id: storeId,
      store_category_id: categoryId,
      title: String(form.get('title') ?? '').trim(),
      image_path: imagePath,
      description,
      is_active: status === '1',
    })
  }

  return (
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="Product Information" columns={2}>
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
            <small className="field-error">
              {formErrors.store_id ?? 'Store or category options could not be loaded.'}
            </small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Product Category" required />
          <SelectField
            options={categoryOptions}
            placeholder={storeId ? 'Search and select category' : 'Select store first'}
            value={categoryId}
            onChange={setCategoryId}
            hasError={Boolean(formErrors.store_category_id)}
          />
          {formErrors.store_category_id ? (
            <small className="field-error">{formErrors.store_category_id}</small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Product Title" required />
          <Input
            name="title"
            maxLength={255}
            aria-invalid={Boolean(formErrors.title)}
            defaultValue={product?.title ?? ''}
          />
          {formErrors.title ? <small className="field-error">{formErrors.title}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <SelectField isSearchable={false} options={publishStatusSelectOptions} value={status} onChange={setStatus} />
        </label>
      </FormSection>

      <FormSection title="Media And Description" columns={2}>
        <label className="form-field">
          <FieldLabel label="Product Image" />
          <FilePickerField
            name="image_path"
            directory="products"
            label="Product image"
            value={imagePath}
            onChange={setImagePath}
          />
        </label>

        <label className="form-field">
          <FieldLabel label="Product Description" />
          <AdminRichTextEditor
            name="description"
            value={description}
            maxLength={1200}
            placeholder="Enter product description"
            helpText="Shown in product details"
            onChange={setDescription}
          />
        </label>
      </FormSection>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : product ? 'Save Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  )
}
