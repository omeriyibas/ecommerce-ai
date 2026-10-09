import { createRouter, RouterProvider } from '@tanstack/react-router'
import { rootRoute } from './layout/router-root.tsx'
import { makeRoutes } from './factory/routes-factory.tsx'
import { useAuth } from '@/features/auth/hooks/useAuth.tsx'
import { RouteLoadingFallback } from '@/providers/router/layout/RouteLoadingFallback.tsx'
import { setAfterLogout } from '@/shared/api/auth-bridge'
import type { User } from '@/shared/types/user'

export type RouterAuthContext = {
  user: User | null
}

const routeTree = rootRoute.addChildren(makeRoutes())

const router = createRouter({
  routeTree,
  context: {
    user: null,
  } satisfies RouterAuthContext,
})

setAfterLogout(() => {
  void router.navigate({ to: '/login', replace: true })
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouterProvider() {
  const { user, initialLoading } = useAuth()

  if (initialLoading) {
    return (
      <RouteLoadingFallback message="Oturum kontrol ediliyor…" />
    )
  }

  return (
    <RouterProvider
      router={router}
      context={{ user }}
    />
  )
}
