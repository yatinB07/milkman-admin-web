import { useSyncExternalStore } from 'react'

export type CrudFormRoute = { mode: 'create' } | { mode: 'edit'; id: number }

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

export function parseCrudFormRoute(path: string, basePath: string): CrudFormRoute | null {
  const normalizedBasePath = normalizePath(basePath)

  if (path === `${normalizedBasePath}/create`) return { mode: 'create' }

  const editPrefix = `${normalizedBasePath}/edit/`

  if (!path.startsWith(editPrefix)) return null

  const id = Number(path.slice(editPrefix.length))

  return Number.isInteger(id) && id > 0 ? { mode: 'edit', id } : null
}

function subscribeToHash(listener: () => void) {
  window.addEventListener('hashchange', listener)

  return () => window.removeEventListener('hashchange', listener)
}

function normalizePath(path: string) {
  if (!path || path === '#') return '/'

  return path.startsWith('/') ? path : `/${path}`
}
