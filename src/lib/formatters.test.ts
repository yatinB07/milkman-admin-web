import { describe, expect, it } from 'vitest'
import { formatAdminDate, serialNumber } from './formatters'

describe('formatAdminDate', () => {
  it('formats valid dates and returns the fallback for empty or invalid dates', () => {
    expect(formatAdminDate('2026-07-08T00:00:00.000Z')).toBe('Jul 8, 2026')
    expect(formatAdminDate(null)).toBe('Never')
    expect(formatAdminDate('not-a-date', 'Not available')).toBe('Not available')
  })
})

describe('serialNumber', () => {
  it('uses the pagination start value when available', () => {
    expect(serialNumber({ from: 21 }, 2)).toBe(23)
    expect(serialNumber({ from: null }, 2)).toBe(3)
  })
})
