export type AdminProfile = {
  id: number
  name: string
  username: string
  email: string
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export type AdminProfileResponse = {
  data: AdminProfile
}

export type AdminProfileFormValues = {
  name: string
  username: string
}

export type AdminProfilePayload = {
  name: string
  username: string
}

export type AdminPasswordFormValues = {
  current_password: string
  password: string
  password_confirmation: string
}

export type AdminPasswordPayload = AdminPasswordFormValues
