import { type FormEvent, useState } from 'react'
import { AdminFilePicker } from '../../components/forms/AdminFilePicker'
import { AdminSelect, type AdminSelectOption } from '../../components/forms/AdminSelect'
import { FieldLabel, FormErrorSummary, FormSection } from '../../components/forms/FormLayout'
import type { StoreCategoryFormValues, StoreCategoryRow } from './storeCategoryTypes'

type StoreCategoryFormProps = {
  category: StoreCategoryRow | null
  storeOptions: AdminSelectOption[]
  formError: string | null
  optionError: boolean
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: StoreCategoryFormValues) => void
}

const statusOptions: AdminSelectOption[] = [
  { label: 'Publish', value: '1' },
  { label: 'Unpublish', value: '0' },
]

export function StoreCategoryForm({
  category,
  storeOptions,
  formError,
  optionError,
  isSaving,
  onCancel,
  onSubmit,
}: StoreCategoryFormProps) {
  const [storeId, setStoreId] = useState(category ? String(category.store_id) : '')
  const [status, setStatus] = useState(category?.is_active === false ? '0' : '1')
  const [imagePath, setImagePath] = useState(category?.image_path ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    onSubmit({
      store_id: storeId,
      title: String(form.get('title') ?? '').trim(),
      image_path: imagePath,
      is_active: status === '1',
    })
  }

  return (
    <form className="store-form" onSubmit={handleSubmit}>
      <FormSection title="Store Category Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Store" required />
          <AdminSelect
            options={storeOptions}
            placeholder="Search and select store"
            value={storeId}
            onChange={setStoreId}
          />
        </label>

        <label className="form-field">
          <FieldLabel label="Category Name" required />
          <input name="title" maxLength={255} defaultValue={category?.title ?? ''} />
        </label>

        <label className="form-field">
          <FieldLabel label="Category Image" />
          <AdminFilePicker name="image_path" label="Category image" value={imagePath} onChange={setImagePath} />
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <AdminSelect isSearchable={false} options={statusOptions} value={status} onChange={setStatus} />
        </label>
      </FormSection>

      <FormErrorSummary errors={[formError, optionError && 'Stores could not be loaded.']} />

      <div className="modal-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-button is-compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : category ? 'Save Category' : 'Add Category'}
        </button>
      </div>
    </form>
  )
}
