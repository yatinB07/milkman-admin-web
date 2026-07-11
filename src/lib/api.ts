import axios from 'axios'

const authTokenKey = 'milkman_admin_token'
let unauthorizedHandler: (() => void) | null = null

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      unauthorizedHandler?.()
    }

    return Promise.reject(error)
  },
)

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export function getAuthToken() {
  return window.localStorage.getItem(authTokenKey)
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(authTokenKey, token)
}

export function clearAuthToken() {
  window.localStorage.removeItem(authTokenKey)
}
