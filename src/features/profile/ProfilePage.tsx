import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { ListLoadError, PageSkeleton, toast } from '../../components/common'
import { AdminSelect } from '../../components/forms/AdminSelect'
import { FieldLabel } from '../../components/forms/FormLayout'
import { adminStore, allowedListPerPage, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import {
  passwordFormDirtyKey,
  PasswordForm,
  profileFormDirtyKey,
  ProfileForm,
  type PasswordFormErrors,
  type ProfileFormErrors,
} from './ProfileForm'
import { getAdminProfile, updateAdminPassword, updateAdminProfile } from './profileRepository'
import { toAdminProfilePayload } from './profileService'
import type { AdminPasswordFormValues, AdminProfileFormValues } from './profileTypes'

export function ProfilePage() {
  const { listPerPage, user } = useAdminStore()
  const queryClient = useQueryClient()
  const [profileErrors, setProfileErrors] = useState<ProfileFormErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({})
  const [passwordFormKey, setPasswordFormKey] = useState(0)

  const profile = useQuery({
    queryKey: ['admin-profile'],
    queryFn: getAdminProfile,
    retry: false,
  })

  const saveProfile = useMutation({
    mutationFn: (values: AdminProfileFormValues) => updateAdminProfile(toAdminProfilePayload(values)),
    onSuccess: async (updatedProfile) => {
      adminStore.setUser({
        id: updatedProfile.id,
        type: user?.type ?? 'admin',
        name: updatedProfile.name,
        email: updatedProfile.email,
        roles: user?.roles ?? [],
        permissions: user?.permissions ?? [],
      })
      dirtyFormStore.reset(profileFormDirtyKey)
      setProfileErrors({})
      await queryClient.invalidateQueries({ queryKey: ['admin-auth-me'] })
      toast.success('Profile updated successfully.')
    },
    onError: (error) => {
      setProfileErrors(readValidationErrors<keyof AdminProfileFormValues>(error, ['name', 'username']))
      toast.error('Profile could not be saved. Check the highlighted fields.')
    },
  })

  const savePassword = useMutation({
    mutationFn: updateAdminPassword,
    onSuccess: () => {
      dirtyFormStore.reset(passwordFormDirtyKey)
      setPasswordErrors({})
      setPasswordFormKey((key) => key + 1)
      toast.success('Password changed successfully.')
    },
    onError: (error) => {
      setPasswordErrors(
        readValidationErrors<keyof AdminPasswordFormValues>(error, [
          'current_password',
          'password',
          'password_confirmation',
        ]),
      )
      toast.error('Password could not be changed. Check the highlighted fields.')
    },
  })

  function handleProfileSubmit(values: AdminProfileFormValues) {
    const errors: ProfileFormErrors = {}

    if (!values.name) errors.name = 'Name is required.'
    if (!values.username) errors.username = 'Username is required.'
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors)
      return
    }

    saveProfile.mutate(values)
  }

  function handlePasswordSubmit(values: AdminPasswordFormValues) {
    const errors: PasswordFormErrors = {}

    if (!values.current_password) errors.current_password = 'Current Password is required.'
    if (values.password.length < 8) errors.password = 'New Password must be at least 8 characters.'
    if (values.password !== values.password_confirmation) errors.password_confirmation = 'Confirm Password must match.'
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    savePassword.mutate(values)
  }

  if (profile.isLoading) {
    return <PageSkeleton label="Loading profile" />
  }

  if (!profile.data) {
    return <ListLoadError message="Profile could not be loaded. Refresh the page or sign in again." />
  }

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <span className="avatar is-large">
          <UserRound aria-hidden="true" size={34} />
        </span>
        <div>
          <h2>{profile.data.name}</h2>
          <p>{profile.data.email}</p>
        </div>
      </div>

      <div className="profile-grid">
        <article className="profile-panel">
          <h3>Account</h3>
          <dl>
            <div>
              <dt>Type</dt>
              <dd>{user?.type ?? 'admin'}</dd>
            </div>
            <div>
              <dt>Username</dt>
              <dd>{profile.data.username}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{profile.data.is_active ? 'Active' : 'Inactive'}</dd>
            </div>
          </dl>
        </article>

        <article className="profile-panel">
          <h3>Access</h3>
          <div className="profile-chip-list">
            {(user?.roles.length ? user.roles : ['admin']).map((role) => (
              <span className="profile-chip" key={role}>
                <ShieldCheck aria-hidden="true" size={15} />
                {role.replace('-', ' ')}
              </span>
            ))}
          </div>
        </article>

        <article className="profile-panel">
          <h3>Preferences</h3>
          <label className="form-field profile-preference">
            <FieldLabel label="Default Rows Per Page" />
            <AdminSelect
              ariaLabel="Default rows per page"
              isSearchable={false}
              options={allowedListPerPage.map((value) => ({ label: String(value), value: String(value) }))}
              value={String(listPerPage)}
              onChange={(value) => {
                adminStore.setListPerPage(Number(value))
                toast.success('List preference updated.')
              }}
            />
          </label>
        </article>
      </div>

      <ProfileForm
        profile={profile.data}
        formErrors={profileErrors}
        isSaving={saveProfile.isPending}
        onSubmit={handleProfileSubmit}
      />

      <PasswordForm
        key={passwordFormKey}
        formErrors={passwordErrors}
        isSaving={savePassword.isPending}
        onSubmit={handlePasswordSubmit}
      />
    </section>
  )
}

function readValidationErrors<Field extends string>(error: unknown, fields: Field[]) {
  if (!isAxiosError(error) || error.response?.status !== 422) return {}

  const data = error.response.data as { message?: string; errors?: Record<string, string[]> }

  return fields.reduce<Partial<Record<Field, string>>>((errors, field) => {
    const message = data.errors?.[field]?.[0] ?? (field === 'current_password' ? data.message : undefined)

    if (message) {
      errors[field] = message
    }

    return errors
  }, {})
}
