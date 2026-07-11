import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { AdminFilePicker } from '../../components/forms/AdminFilePicker'
import { AdminSelect } from '../../components/forms/AdminSelect'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { CategoryFormValues, CategoryRow } from './categoryTypes'

type CategoryFormProps = {
  category: CategoryRow | null
  formErrors: Partial<Record<'title', string>>
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: CategoryFormValues) => void
}

export function CategoryForm({ category, formErrors, isSaving, onCancel, onSubmit }: CategoryFormProps) {
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
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="Category Information" columns={2}>
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
          <FieldLabel label="Status" />
          <AdminSelect isSearchable={false} options={publishStatusSelectOptions} value={status} onChange={setStatus} />
        </label>

        <label className="form-field">
          <FieldLabel label="Category Image" />
          <AdminFilePicker
            name="image_path"
            directory="categories"
            label="Category image"
            value={imagePath}
            onChange={setImagePath}
          />
        </label>

        <label className="form-field">
          <FieldLabel label="Category Cover" />
          <AdminFilePicker
            name="cover_path"
            directory="categories"
            label="Category cover"
            value={coverPath}
            onChange={setCoverPath}
          />
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
