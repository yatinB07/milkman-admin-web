import { type FormEvent, useState } from 'react'
import { Button } from '../../components/common'
import { FilePickerField } from '../../components/forms/FilePickerField'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { SelectField, type SelectFieldOption } from '../../components/forms/SelectField'
import { publishStatusSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { StoreGalleryImageFormValues, StoreGalleryImageRow } from './storeGalleryImageTypes'

type StoreGalleryImageFormProps = {
  image: StoreGalleryImageRow | null
  storeOptions: SelectFieldOption[]
  formErrors: Partial<Record<'store_id' | 'image_path', string>>
  optionError: boolean
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: StoreGalleryImageFormValues) => void
}

export function StoreGalleryImageForm({
  image,
  storeOptions,
  formErrors,
  optionError,
  isSaving,
  onCancel,
  onSubmit,
}: StoreGalleryImageFormProps) {
  const [storeId, setStoreId] = useState(image ? String(image.store_id) : '')
  const [imagePath, setImagePath] = useState(image?.image_path ?? '')
  const [status, setStatus] = useState(image?.is_active === false ? '0' : '1')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmit({
      store_id: storeId,
      image_path: imagePath,
      is_active: status === '1',
    })
  }

  return (
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <FormSection title="Store Gallery Image Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Store" required />
          <SelectField
            options={storeOptions}
            placeholder="Search and select store"
            value={storeId}
            onChange={setStoreId}
            hasError={Boolean(formErrors.store_id || optionError)}
          />
          {formErrors.store_id || optionError ? (
            <small className="field-error">{formErrors.store_id ?? 'Store options could not be loaded.'}</small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Status" />
          <SelectField isSearchable={false} options={publishStatusSelectOptions} value={status} onChange={setStatus} />
        </label>

        <label className="form-field">
          <FieldLabel label="Store Gallery Image" required />
          <FilePickerField
            name="image_path"
            directory="stores"
            label="Store gallery image"
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
          {isSaving ? 'Saving...' : image ? 'Save Store Gallery Image' : 'Add Store Gallery Image'}
        </Button>
      </div>
    </form>
  )
}
