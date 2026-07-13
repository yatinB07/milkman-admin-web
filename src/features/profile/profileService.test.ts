import { describe, expect, it } from 'vitest'
import { toAdminProfilePayload } from './profileService'

describe('toAdminProfilePayload', () => {
  it('trims editable profile fields', () => {
    expect(toAdminProfilePayload({ name: ' Admin ', username: ' root ' })).toEqual({
      name: 'Admin',
      username: 'root',
    })
  })
})
