import axios from 'axios'

const authTokenKey = 'milkman_admin_token'

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

export function getAuthToken() {
  return window.localStorage.getItem(authTokenKey)
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(authTokenKey, token)
}

export function clearAuthToken() {
  window.localStorage.removeItem(authTokenKey)
}
