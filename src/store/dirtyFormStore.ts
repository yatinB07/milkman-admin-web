const discardMessage = 'Discard unsaved changes? Your changes will be lost.'
const defaultFormKey = 'default'

const dirtyForms = new Set<string>()

export const dirtyFormStore = {
  isDirty: () => dirtyForms.size > 0,
  markDirty(formKey = defaultFormKey) {
    dirtyForms.add(formKey)
  },
  reset(formKey?: string) {
    if (formKey) {
      dirtyForms.delete(formKey)
      return
    }

    dirtyForms.clear()
  },
  confirmDiscard() {
    if (dirtyForms.size === 0) return true

    if (!window.confirm(discardMessage)) return false

    dirtyForms.clear()
    return true
  },
}

export const dirtyFormCaptureProps = createDirtyFormCaptureProps(defaultFormKey)

export function createDirtyFormCaptureProps(formKey: string) {
  return {
    onInputCapture: () => dirtyFormStore.markDirty(formKey),
    onChangeCapture: () => dirtyFormStore.markDirty(formKey),
  }
}
