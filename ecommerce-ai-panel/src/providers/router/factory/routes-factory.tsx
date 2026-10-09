import { createRoute, Outlet } from '@tanstack/react-router'
import { rootRoute } from '../layout/router-root.tsx'
import { routesAndMenuItems } from '../config/routes.config.tsx'
import { requireRoles } from '@/shared/auth/guards.tsx'

/**
 * Config'ten TanStack route düğümleri üretir
 * - Üst ve alt item'ları rootRoute'a bağlar
 * - beforeLoad ile rol guard çalıştırır
 * - `navGroupOnly` + `subs`: yalnızca alt rotalar kayıtlı olur (üst path için sayfa yok)
 */

export function makeRoutes() {
    const nodes: any[] = []

    for (const item of routesAndMenuItems) {
        if (item.path === '/') {
            nodes.push(
                createRoute({
                    getParentRoute: () => rootRoute,
                    path: '/',
                    beforeLoad: ({ context }) => requireRoles(context as any, item.roles as any),
                    component: () =>
                        item.pageComponent ? (
                            <item.pageComponent />
                        ) : (
                            <Outlet />
                        ),
                })
            )
            continue
        }

        if (item.subs?.length) {
            for (const s of item.subs) {
                const roles = (s.roles ?? item.roles) as any
                nodes.push(
                    createRoute({
                        getParentRoute: () => rootRoute,
                        path: s.path.replace(/^\//, ''),
                        ...(s.validateSearch
                            ? { validateSearch: s.validateSearch }
                            : {}),
                        beforeLoad: ({ context }) => requireRoles(context as any, roles),
                        component: () =>
                            s.pageComponent ? (
                                <s.pageComponent />
                            ) : (
                                <Outlet />
                            ),
                    })
                )
            }
            if (!item.navGroupOnly && item.pageComponent) {
                const conflict = item.subs.some((s) => s.path === item.path)
                if (!conflict) {
                    nodes.push(
                        createRoute({
                            getParentRoute: () => rootRoute,
                            path: item.path.replace(/^\//, ''),
                            beforeLoad: ({ context }) => requireRoles(context as any, item.roles as any),
                            component: () =>
                                item.pageComponent ? (
                                    <item.pageComponent />
                                ) : (
                                    <Outlet />
                                ),
                        })
                    )
                }
            }
        } else {
            nodes.push(
                createRoute({
                    getParentRoute: () => rootRoute,
                    path: item.path.replace(/^\//, ''),
                    beforeLoad: ({ context }) => requireRoles(context as any, item.roles as any),
                    component: () =>
                        item.pageComponent ? (
                            <item.pageComponent />
                        ) : (
                            <Outlet />
                        ),
                })
            )
        }
    }

    return nodes
}
