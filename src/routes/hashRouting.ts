import { useSyncExternalStore } from 'react'

export function useHashPath() {
  return useSyncExternalStore(subscribeToHash, getHashPath, getHashPath)
}

export function getHashPath() {
  return normalizePath(window.location.hash.replace(/^#/, ''))
}

export function navigateToHash(path: string) {
  const nextPath = normalizePath(path)

  if (getHashPath() === nextPath) return

  window.location.hash = nextPath
}

function subscribeToHash(listener: () => void) {
  window.addEventListener('hashchange', listener)

  return () => window.removeEventListener('hashchange', listener)
}

function normalizePath(path: string) {
  if (!path || path === '#') return '/'

  return path.startsWith('/') ? path : `/${path}`
}
