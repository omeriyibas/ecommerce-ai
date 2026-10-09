import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getAccessToken, logoutFromApi } from './auth-bridge'
import { refreshAccessToken } from './refresh'
import { apiUrl } from './base-url'

type WithRetry = AxiosRequestConfig & { _retry?: boolean }

interface RefreshQueueItem {
  resolve: (token: string | null) => void
  reject: (err: unknown) => void
}

const api = axios.create({
  baseURL: apiUrl,
  timeout: 20000,
  withCredentials: true,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let queue: RefreshQueueItem[] = []

const flushQueue = (err: unknown, token: string | null = null) => {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)))
  queue = []
}

const toApiError = (error: unknown) => {
  const ax = error as AxiosError<{ detail?: unknown; message?: string }>
  const status = ax.response?.status
  const data = ax.response?.data
  const detail = data?.detail
  const message =
    (typeof detail === 'string' ? detail : null) ??
    (typeof data?.message === 'string' ? data.message : null) ??
    ax.message ??
    'Network or unknown error'
  return { status, message, raw: error }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = (error.config || {}) as WithRetry

    if (!error.response && error.request) {
      return Promise.reject(toApiError(error))
    }

    const status = error.response?.status

    if ((status === 401 || status === 419) && !original._retry) {
      if (original.url?.includes('/auth/login')) {
        return Promise.reject(toApiError(error))
      }

      if (original.url?.includes('/auth/refresh')) {
        logoutFromApi()
        return Promise.reject(toApiError(error))
      }

      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token: string | null) => {
              if (token) {
                original.headers = original.headers ?? {}
                ;(original.headers as Record<string, string>).Authorization =
                  `Bearer ${token}`
              }
              resolve(api(original))
            },
            reject,
          })
        })
      }

      isRefreshing = true
      try {
        const newAccess = await refreshAccessToken()
        if (!newAccess) {
          throw new Error('Token refresh failed')
        }

        flushQueue(null, newAccess)

        original.headers = original.headers ?? {}
        ;(original.headers as Record<string, string>).Authorization =
          `Bearer ${newAccess}`
        return api(original)
      } catch (e) {
        flushQueue(e, null)
        logoutFromApi()
        return Promise.reject(toApiError(e))
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(toApiError(error))
  },
)

export default api
