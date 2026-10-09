/**
 * HTTP client ↔ auth store köprüsü.
 * Store'u import etmeden token okuma/yazma (circular dependency önler).
 */

let getTokenCallback: (() => string | null) | null = null
let getRefreshTokenCallback: (() => string | null) | null = null
let setTokensCallback: ((tokens: { access: string; refresh?: string }) => void) | null = null
let logoutCallback: (() => void) | null = null
let afterLogoutCallback: (() => void) | null = null

export const setAuthCallbacks = (callbacks: {
  getToken: () => string | null
  getRefreshToken: () => string | null
  setTokens: (tokens: { access: string; refresh?: string }) => void
  logout: () => void
}) => {
  getTokenCallback = callbacks.getToken
  getRefreshTokenCallback = callbacks.getRefreshToken
  setTokensCallback = callbacks.setTokens
  logoutCallback = callbacks.logout
}

/** Router hazır olunca kaydedilir; circular import önler. */
export function setAfterLogout(callback: () => void): void {
  afterLogoutCallback = callback
}

export function runAfterLogout(): void {
  afterLogoutCallback?.()
}

export function getAccessToken(): string | null {
  return getTokenCallback?.() ?? null
}

export function getRefreshToken(): string | null {
  return getRefreshTokenCallback?.() ?? null
}

export function setAuthTokens(tokens: { access: string; refresh?: string }): void {
  setTokensCallback?.(tokens)
}

export function logoutFromApi(): void {
  logoutCallback?.()
}
