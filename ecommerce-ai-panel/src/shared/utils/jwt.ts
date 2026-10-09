/** Access JWT payload (imza doğrulanmaz; yalnızca exp okuma). */

export type JwtPayload = {
  exp?: number
  [key: string]: unknown
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".")
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function getJwtExpiresAtMs(token: string): number | null {
  const exp = decodeJwtPayload(token)?.exp
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null
  return exp * 1000
}

export function formatRemainingMs(ms: number): string {
  if (ms <= 0) return "Süresi doldu"
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  if (hours > 0) {
    return `${hours} sa ${minutes} dk ${seconds} sn`
  }
  if (minutes > 0) {
    return `${minutes} dk ${seconds} sn`
  }
  return `${seconds} sn`
}
