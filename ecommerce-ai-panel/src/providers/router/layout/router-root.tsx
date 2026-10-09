import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { RouteLoadingFallback } from '@/providers/router/layout/RouteLoadingFallback.tsx'
import { useDispatch } from 'react-redux'
import { setPageTitle } from '@/features/ui/model/slice.tsx'
import {
  routesAndMenuItems,
  routeHasNavbar,
} from '@/providers/router/config/routes.config.tsx'
import NavBar from '@/providers/router/layout/NavBar.tsx'
import Header from '@/providers/router/layout/Header.tsx'

export const rootRoute = createRootRoute({
  component: () => {
    const { pathname } = useLocation()
    const dispatch = useDispatch()
    const logoUrl = `${import.meta.env.BASE_URL}logo.png`

    const showNavbar = routeHasNavbar(pathname)

    const resolvePageTitle = (currentPath: string): string => {
      for (const route of routesAndMenuItems) {
        if (route.path === currentPath && route.label) return route.label
        if (route.subs?.length) {
          const sub = route.subs.find((s) => s.path === currentPath)
          if (sub?.label) return sub.label
        }
      }
      return ''
    }

    useEffect(() => {
      dispatch(setPageTitle(resolvePageTitle(pathname)))
    }, [pathname, dispatch])

    if (!showNavbar) {
      return (
        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      )
    }

    return (
      <>
        <section>
          <aside className="fixed top-0 left-0 z-50 h-screen w-80 rounded-br-xl bg-primary py-10 shadow-2xl">
            <Link
              to="/"
              className="mb-5 flex cursor-pointer items-center justify-center px-5"
            >
              <span className="flex h-24 w-full items-center justify-center rounded-2xl bg-white px-3 py-2 shadow-sm">
                <img
                  src={logoUrl}
                  alt="Shopiva"
                  className="logo-icon h-full w-auto max-h-20 object-contain"
                />
              </span>
            </Link>
            <NavBar />
          </aside>
        </section>

        <div className="ml-80 flex min-h-screen min-w-0 flex-col">
          <Header />
          <div className="min-w-0 px-8 pt-32 md:px-12 lg:px-20">
            <Suspense fallback={<RouteLoadingFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </>
    )
  },
})
