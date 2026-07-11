import { useSyncExternalStore } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastMessage = {
  id: number
  message: string
  tone: ToastTone
}

const listeners = new Set<() => void>()
let messages: ToastMessage[] = []
let nextId = 1

function emit() {
  listeners.forEach((listener) => listener())
}

function addToast(tone: ToastTone, message: string) {
  const id = nextId
  nextId += 1
  messages = [...messages, { id, message, tone }]
  emit()
  window.setTimeout(() => toast.dismiss(id), 4500)
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

function getSnapshot() {
  return messages
}

export const toast = {
  success: (message: string) => addToast('success', message),
  error: (message: string) => addToast('error', message),
  info: (message: string) => addToast('info', message),
  dismiss: (id: number) => {
    messages = messages.filter((message) => message.id !== id)
    emit()
  },
}

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
