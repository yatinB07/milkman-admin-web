import { isAxiosError } from 'axios'

type ValidationErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

export function readFieldErrors<Field extends string>(
  error: unknown,
  fields: readonly Field[],
  fallbackMessages: Partial<Record<Field, string>> = {},
): Partial<Record<Field, string>> {
  const response = getValidationErrorResponse(error)
  if (!response) return {}

  return fields.reduce<Partial<Record<Field, string>>>((errors, field) => {
    const message = response.errors?.[field]?.[0] ?? fallbackMessages[field]

    if (message) {
      errors[field] = message
    }

    return errors
  }, {})
}

export function getValidationErrorResponse(error: unknown): ValidationErrorResponse | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null

  return error.response.data as ValidationErrorResponse
}
