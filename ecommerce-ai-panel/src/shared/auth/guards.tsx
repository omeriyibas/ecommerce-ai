/**
 * Route beforeLoad guard.
 * Roller: `user` | `admin` — admin tüm role kapılarını geçer.
 */
import { redirect } from "@tanstack/react-router"

type Ctx = { user?: { role?: string | null } } | undefined

/** Menü / rota erişimi — admin bypass. */
export function canAccessRoles(
  role: string | null | undefined,
  roles?: readonly string[],
): boolean {
  if (!roles || roles.length === 0) return true
  if (!role) return false
  if (role === "admin") return true
  return roles.includes(role)
}

export function requireRoles(ctx: Ctx, roles?: readonly string[]) {
  if (!roles || roles.length === 0) return

  if (!ctx?.user) {
    throw redirect({ to: "/login", replace: true })
  }

  const cur = ctx.user.role ?? null
  if (!canAccessRoles(cur, roles)) {
    throw redirect({ to: "/login", replace: true })
  }
}
