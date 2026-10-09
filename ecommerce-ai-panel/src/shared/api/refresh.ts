import axios from 'axios'
import { setAuthTokens } from './auth-bridge'
import { apiUrl } from './base-url'

type RefreshResponse = {
  access_token: string
  refresh_token?: string
}

/**
 * Access token yeniler (HTTP 401 için).
 * Refresh: HttpOnly cookie (credentials); body kullanılmaz.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    // Global axios: api interceptor döngüsüne girmesin
    const { data } = await axios.post<RefreshResponse>(
      `${apiUrl}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    const newAccess = data?.access_token
    if (!newAccess) return null

    setAuthTokens({ access: newAccess })
    return newAccess
  } catch (e) {
    console.warn('[auth] Token yenileme başarısız', e)
    return null
  }
}
