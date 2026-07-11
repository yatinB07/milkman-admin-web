import { type FormEvent, useState } from 'react'
import { AdminFilePicker } from '../../components/forms/AdminFilePicker'
import { AdminSelect, type AdminSelectOption } from '../../components/forms/AdminSelect'
import { FieldLabel, FormErrorSummary, FormSection } from '../../components/forms/FormLayout'
import type { CategoryFormValues, CategoryRow } from './categoryTypes'

type CategoryFormProps = {
  category: CategoryRow | null
  formError: string | null
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: CategoryFormValues) => void
}

const statusOptions: AdminSelectOption[] = [
  { label: 'Publish', value: '1' },
  { label: 'Unpublish', value: '0' },
]

export function CategoryForm({ category, formError, isSaving, onCancel, onSubmit }: CategoryFormProps) {
  const [status, setStatus] = useState(category?.is_active === false ? '0' : '1')
  const [imagePath, setImagePath] = useState(category?.image_path ?? '')
  const [coverPath, setCoverPath] = useState(category?.cover_path ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    onSubmit({
      title: String(form.get('title') ?? '').trim(),
      image_path: imagePath,
      cover_path: coverPath,
      is_active: status === '1',
    })
  }

  return (
    <form className="store-form" onSubmit={handleSubmit}>
      <FormSection title="Category Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Category Name" required />
          <input name="title" maxLength={255} defaultValue={category?.title ?? ''} />
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <AdminSelect isSearchable={false} options={statusOptions} value={status} onChange={setStatus} />
        </label>

        <label className="form-field">
          <FieldLabel label="Category Image" />
          <AdminFilePicker name="image_path" label="Category image" value={imagePath} onChange={setImagePath} />
        </label>

        <label className="form-field">
          <FieldLabel label="Category Cover" />
          <AdminFilePicker name="cover_path" label="Category cover" value={coverPath} onChange={setCoverPath} />
        </label>
      </FormSection>

      <FormErrorSummary errors={[formError]} />

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
