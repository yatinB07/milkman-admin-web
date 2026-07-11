import { type FormEvent, useState } from 'react'
import { AdminFilePicker } from '../../components/forms/AdminFilePicker'
import { AdminSelect, type AdminSelectOption } from '../../components/forms/AdminSelect'
import { AdminTextarea } from '../../components/forms/AdminTextarea'
import { FieldLabel, FormErrorSummary, FormSection } from '../../components/forms/FormLayout'
import type { ProductFormValues, ProductRow } from './productTypes'

type ProductFormProps = {
  product: ProductRow | null
  storeOptions: AdminSelectOption[]
  categoryOptions: AdminSelectOption[]
  formError: string | null
  optionError: boolean
  isSaving: boolean
  onStoreChange: (storeId: string) => void
  onCancel: () => void
  onSubmit: (values: ProductFormValues) => void
}

const statusOptions: AdminSelectOption[] = [
  { label: 'Publish', value: '1' },
  { label: 'Unpublish', value: '0' },
]

export function ProductForm({
  product,
  storeOptions,
  categoryOptions,
  formError,
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
    <form className="store-form" onSubmit={handleSubmit}>
      <FormSection title="Product Information" columns={2}>
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
          <FieldLabel label="Product Category" required />
          <AdminSelect
            options={categoryOptions}
            placeholder={storeId ? 'Search and select category' : 'Select store first'}
            value={categoryId}
            onChange={setCategoryId}
          />
        </label>

        <label className="form-field">
          <FieldLabel label="Product Title" required />
          <input name="title" maxLength={255} defaultValue={product?.title ?? ''} />
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <AdminSelect isSearchable={false} options={statusOptions} value={status} onChange={setStatus} />
        </label>
      </FormSection>

      <FormSection title="Media And Description" columns={2}>
        <label className="form-field">
          <FieldLabel label="Product Image" />
          <AdminFilePicker name="image_path" label="Product image" value={imagePath} onChange={setImagePath} />
        </label>

        <label className="form-field">
          <FieldLabel label="Product Description" />
          <AdminTextarea
            name="description"
            value={description}
            maxLength={1200}
            placeholder="Enter product description"
            helpText="Shown in product details"
            onChange={setDescription}
          />
        </label>
      </FormSection>

      <FormErrorSummary errors={[formError, optionError && 'Store or category options could not be loaded.']} />

      <div className="modal-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-button is-compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : product ? 'Save Product' : 'Add Product'}
        </button>
      </div>
    </form>
  )
}
