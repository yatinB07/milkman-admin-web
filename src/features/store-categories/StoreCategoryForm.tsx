import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { AdminFilePicker } from '../../components/forms/AdminFilePicker'
import { AdminSelect, type AdminSelectOption } from '../../components/forms/AdminSelect'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { StoreCategoryFormValues, StoreCategoryRow } from './storeCategoryTypes'

type StoreCategoryFormProps = {
  category: StoreCategoryRow | null
  storeOptions: AdminSelectOption[]
  formErrors: Partial<Record<'store_id' | 'title', string>>
  optionError: boolean
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: StoreCategoryFormValues) => void
}

export function StoreCategoryForm({
  category,
  storeOptions,
  formErrors,
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
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="Store Category Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Store" required />
          <AdminSelect
            options={storeOptions}
            placeholder="Search and select store"
            value={storeId}
            onChange={setStoreId}
            hasError={Boolean(formErrors.store_id || optionError)}
          />
          {formErrors.store_id || optionError ? (
            <small className="field-error">
              {formErrors.store_id ?? 'Stores could not be loaded.'}
            </small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Category Name" required />
          <Input
            name="title"
            maxLength={255}
            aria-invalid={Boolean(formErrors.title)}
            defaultValue={category?.title ?? ''}
          />
          {formErrors.title ? <small className="field-error">{formErrors.title}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Category Image" />
          <AdminFilePicker
            name="image_path"
            directory="store-categories"
            label="Category image"
            value={imagePath}
            onChange={setImagePath}
          />
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <AdminSelect isSearchable={false} options={publishStatusSelectOptions} value={status} onChange={setStatus} />
        </label>
      </FormSection>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : category ? 'Save Category' : 'Add Category'}
        </Button>
      </div>
    </form>
  )
}
