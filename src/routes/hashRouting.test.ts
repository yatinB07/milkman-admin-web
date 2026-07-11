import { describe, expect, it } from 'vitest'
import { parseCrudFormRoute } from './hashRouting'

describe('parseCrudFormRoute', () => {
  it('matches create routes for a module base path', () => {
    expect(parseCrudFormRoute('/stores/create', '/stores')).toEqual({ mode: 'create' })
  })

  it('matches edit routes with a positive numeric id', () => {
    expect(parseCrudFormRoute('/product-variants/edit/42', '/product-variants')).toEqual({
      mode: 'edit',
      id: 42,
    })
  })

  it('ignores unrelated or invalid edit routes', () => {
    expect(parseCrudFormRoute('/stores', '/stores')).toBeNull()
    expect(parseCrudFormRoute('/stores/edit/test', '/stores')).toBeNull()
    expect(parseCrudFormRoute('/stores/edit/0', '/stores')).toBeNull()
  })
})
