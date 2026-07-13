import { describe, expect, it } from 'vitest'
import { assetUrl } from './api'

describe('assetUrl', () => {
  it('resolves relative media paths against the API host', () => {
    expect(assetUrl('images/store/logo.png')).toBe('http://localhost:8000/images/store/logo.png')
  })

  it('keeps absolute and blob urls unchanged', () => {
    expect(assetUrl('https://example.com/logo.png')).toBe('https://example.com/logo.png')
    expect(assetUrl('blob:http://localhost/preview')).toBe('blob:http://localhost/preview')
  })
})
