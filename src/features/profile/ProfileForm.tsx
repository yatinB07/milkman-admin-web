import { type FormEvent } from 'react'
import { Button, Input } from '../../components/common'
import { FieldLabel, FormSection } from '../../components/forms/FormLayout'
import { createDirtyFormCaptureProps } from '../../store/dirtyFormStore'
import type { AdminPasswordFormValues, AdminProfile, AdminProfileFormValues } from './profileTypes'

export const profileFormDirtyKey = 'profile-details'
export const passwordFormDirtyKey = 'profile-password'
export type ProfileFormErrors = Partial<Record<keyof AdminProfileFormValues, string>>
export type PasswordFormErrors = Partial<Record<keyof AdminPasswordFormValues, string>>

type ProfileFormProps = {
  formErrors: ProfileFormErrors
  isSaving: boolean
  profile: AdminProfile
  onSubmit: (values: AdminProfileFormValues) => void
}

export function ProfileForm({ formErrors, isSaving, profile, onSubmit }: ProfileFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    onSubmit({
      name: String(form.get('name') ?? '').trim(),
      username: String(form.get('username') ?? '').trim(),
    })
  }

  return (
    <form className="admin-form profile-form" {...createDirtyFormCaptureProps(profileFormDirtyKey)} onSubmit={handleSubmit}>
      <FormSection title="Profile Information" columns={2}>
        <label className="form-field">
          <FieldLabel label="Name" required />
          <Input name="name" maxLength={255} defaultValue={profile.name} aria-invalid={Boolean(formErrors.name)} />
          {formErrors.name ? <small className="field-error">{formErrors.name}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Username" required />
          <Input name="username" maxLength={255} defaultValue={profile.username} aria-invalid={Boolean(formErrors.username)} />
          {formErrors.username ? <small className="field-error">{formErrors.username}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Email" />
          <Input value={profile.email} disabled readOnly />
        </label>
      </FormSection>

      <div className="form-actions">
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  )
}

type PasswordFormProps = {
  formErrors: PasswordFormErrors
  isSaving: boolean
  onSubmit: (values: AdminPasswordFormValues) => void
}

export function PasswordForm({ formErrors, isSaving, onSubmit }: PasswordFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    onSubmit({
      current_password: String(form.get('current_password') ?? ''),
      password: String(form.get('password') ?? ''),
      password_confirmation: String(form.get('password_confirmation') ?? ''),
    })
  }

  return (
    <form className="admin-form profile-form" {...createDirtyFormCaptureProps(passwordFormDirtyKey)} onSubmit={handleSubmit}>
      <FormSection title="Password" columns={3}>
        <label className="form-field">
          <FieldLabel label="Current Password" required />
          <Input
            name="current_password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(formErrors.current_password)}
          />
          {formErrors.current_password ? <small className="field-error">{formErrors.current_password}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="New Password" required />
          <Input
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            aria-invalid={Boolean(formErrors.password)}
          />
          {formErrors.password ? <small className="field-error">{formErrors.password}</small> : null}
        </label>

        <label className="form-field">
          <FieldLabel label="Confirm Password" required />
          <Input
            name="password_confirmation"
            type="password"
            minLength={8}
            autoComplete="new-password"
            aria-invalid={Boolean(formErrors.password_confirmation)}
          />
          {formErrors.password_confirmation ? (
            <small className="field-error">{formErrors.password_confirmation}</small>
          ) : null}
        </label>
      </FormSection>

      <div className="form-actions">
        <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Change Password'}
        </Button>
      </div>
    </form>
  )
}
