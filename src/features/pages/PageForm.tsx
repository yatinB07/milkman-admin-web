import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { RichTextField } from '../../components/forms/RichTextField'
import { SelectField } from '../../components/forms/SelectField'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { PageFormValues, PageRow } from './pageTypes'

type PageFormProps = {
  page: PageRow | null
  formErrors: Partial<Record<'title' | 'description', string>>
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: PageFormValues) => void
}

export function PageForm({ page, formErrors, isSaving, onCancel, onSubmit }: PageFormProps) {
  const [title, setTitle] = useState(page?.title ?? '')
  const [description, setDescription] = useState(page?.description ?? '')
  const [status, setStatus] = useState(page?.is_active === false ? '0' : '1')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmit({
      title,
      description,
      is_active: status === '1',
    })
  }

  return (
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="Page Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Title" required />
          <Input
            value={title}
            maxLength={255}
            aria-invalid={Boolean(formErrors.title)}
            placeholder="Enter page title"
            onChange={(event) => setTitle(event.target.value)}
          />
          {formErrors.title ? <small className="field-error">{formErrors.title}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <SelectField isSearchable={false} options={publishStatusSelectOptions} value={status} onChange={setStatus} />
        </label>

        <label className="form-field span-2">
          <FieldLabel label="Description" required />
          <RichTextField
            name="description"
            value={description}
            placeholder="Enter page content"
            helpText="Customer-facing static page content."
            onChange={setDescription}
          />
          {formErrors.description ? <small className="field-error">{formErrors.description}</small> : null}
        </label>
      </FormSection>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : page ? 'Save Page' : 'Add Page'}
        </Button>
      </div>
    </form>
  )
}
