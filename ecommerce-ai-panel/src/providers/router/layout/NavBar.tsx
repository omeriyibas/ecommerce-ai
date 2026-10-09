import React, { useMemo } from "react"
import {
  type RouteMenuItem,
  routesAndMenuItems,
} from "@/providers/router/config/routes.config.tsx"
import DropDownInside from "@/providers/router/layout/navbar/NavDropDown/DropDownInside.tsx"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { canAccessRoles } from "@/shared/auth/guards.tsx"

const NavBar: React.FC = () => {
  const { role } = useAuth()

  const items = useMemo(
    () =>
      routesAndMenuItems
        .filter((item: RouteMenuItem) => item.showInNav !== false)
        .filter((item: RouteMenuItem) => canAccessRoles(role, item.roles))
        .map((item: RouteMenuItem) => {
          if (!item.subs?.length) return item
          const subs = item.subs.filter((sub) =>
            canAccessRoles(role, sub.roles ?? item.roles),
          )
          return { ...item, subs }
        })
        .filter(
          (item) =>
            !item.subs || item.subs.length > 0 || !!item.pageComponent,
        ),
    [role],
  )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <ul className="m-0 list-none p-0">
        {items.map((item: RouteMenuItem, index) => (
          <DropDownInside
            icon={item.icon}
            label={item.label || ""}
            path={item.path}
            subs={item.subs}
            key={index}
          />
        ))}
      </ul>
    </div>
  )
}

export default NavBar
