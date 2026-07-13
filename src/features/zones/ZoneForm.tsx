import { type FormEvent, useState } from 'react'
import { Button, Input } from '../../components/common'
import { SelectField, type SelectFieldOption } from '../../components/forms/SelectField'
import { FieldLabel } from '../../components/forms/FormLayout'
import { ZonePolygonMap } from '../../components/maps/ZonePolygonMap'
import { dirtyFormCaptureProps } from '../../store/dirtyFormStore'
import { resolveZoneAlias, validateZoneForm } from './zoneService'
import type { ZoneFormErrors, ZoneFormValues, ZoneRow } from './zoneTypes'

type ZoneFormProps = {
  zone: ZoneRow | null
  formErrors: ZoneFormErrors
  isSaving: boolean
  onErrorsChange: (errors: ZoneFormErrors) => void
  onCancel: () => void
  onSubmit: (values: ZoneFormValues) => void
}

const statusOptions: SelectFieldOption[] = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
]

export function ZoneForm({
  zone,
  formErrors,
  isSaving,
  onErrorsChange,
  onCancel,
  onSubmit,
}: ZoneFormProps) {
  const [coordinates, setCoordinates] = useState(zone?.coordinates ?? '')
  const [status, setStatus] = useState(String(zone?.is_active ?? true))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const values: ZoneFormValues = {
      title: String(form.get('title') ?? ''),
      coordinates,
      alias: resolveZoneAlias(String(form.get('alias') ?? ''), coordinates, zone),
      is_active: status === 'true',
    }
    const errors = validateZoneForm(values, status)

    onErrorsChange(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    onSubmit(values)
  }

  return (
    <form className="admin-form" {...dirtyFormCaptureProps} onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="form-field">
          <FieldLabel label="Zone Title" required />
          <Input
            name="title"
            required
            maxLength={255}
            aria-invalid={Boolean(formErrors.title)}
            aria-describedby={formErrors.title ? 'zone-title-error' : undefined}
            defaultValue={zone?.title ?? ''}
          />
          {formErrors.title ? (
            <small className="field-error" id="zone-title-error">
              {formErrors.title}
            </small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Alias" />
          <Input
            name="alias"
            maxLength={255}
            aria-invalid={Boolean(formErrors.alias)}
            aria-describedby={formErrors.alias ? 'zone-alias-error' : undefined}
            defaultValue={zone?.alias ?? ''}
          />
          {formErrors.alias ? (
            <small className="field-error" id="zone-alias-error">
              {formErrors.alias}
            </small>
          ) : null}
        </label>

        <label className="form-field is-wide">
          <FieldLabel label="Coordinates" required />
          <ZonePolygonMap
            value={coordinates}
            onChange={setCoordinates}
            hasError={Boolean(formErrors.coordinates)}
            errorId={formErrors.coordinates ? 'zone-coordinates-error' : undefined}
          />
          {formErrors.coordinates ? (
            <small className="field-error" id="zone-coordinates-error">
              {formErrors.coordinates}
            </small>
          ) : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Status" required />
          <SelectField
            isSearchable={false}
            options={statusOptions}
            value={status}
            onChange={setStatus}
            hasError={Boolean(formErrors.is_active)}
          />
          {formErrors.is_active ? (
            <small className="field-error" id="zone-status-error">
              {formErrors.is_active}
            </small>
          ) : null}
        </label>
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : zone ? 'Update Zone' : 'Create Zone'}
        </Button>
      </div>
    </form>
  )
}
