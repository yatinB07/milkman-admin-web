const discardMessage = 'Discard unsaved changes? Your changes will be lost.'

let dirty = false

export const dirtyFormStore = {
  isDirty: () => dirty,
  markDirty() {
    dirty = true
  },
  reset() {
    dirty = false
  },
  confirmDiscard() {
    if (!dirty) return true

    if (!window.confirm(discardMessage)) return false

    dirty = false
    return true
  },
}
