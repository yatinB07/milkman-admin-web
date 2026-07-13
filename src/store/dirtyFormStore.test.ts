import { beforeEach, describe, expect, it, vi } from 'vitest'

async function loadDirtyFormStore() {
  vi.resetModules()

  return import('./dirtyFormStore')
}

describe('dirtyFormStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('tracks independent dirty form keys', async () => {
    const { dirtyFormStore } = await loadDirtyFormStore()

    dirtyFormStore.markDirty('profile')
    dirtyFormStore.markDirty('password')
    dirtyFormStore.reset('profile')

    expect(dirtyFormStore.isDirty()).toBe(true)

    dirtyFormStore.reset('password')

    expect(dirtyFormStore.isDirty()).toBe(false)
  })

  it('clears every dirty form after discard confirmation', async () => {
    const { dirtyFormStore } = await loadDirtyFormStore()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    dirtyFormStore.markDirty('profile')
    dirtyFormStore.markDirty('password')

    expect(dirtyFormStore.confirmDiscard()).toBe(true)
    expect(dirtyFormStore.isDirty()).toBe(false)
  })
})
