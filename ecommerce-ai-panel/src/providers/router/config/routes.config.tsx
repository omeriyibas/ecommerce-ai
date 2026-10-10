import { lazy } from "react"
import type { ComponentType, LazyExoticComponent } from "react"
import type { SearchSchemaInput } from "@tanstack/react-router"
import {
  CheckSquare,
  CreditCard,
  FileText,
  Home,
  MessageCircle,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react"

const HomePage = lazy(() => import("@/pages/HomePage"))
const UsersPage = lazy(() => import("@/pages/UsersPage"))
const ProductsPage = lazy(() => import("@/pages/ProductsPage"))
const OrdersPage = lazy(() => import("@/pages/OrdersPage"))
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"))
const DocumentsPage = lazy(() => import("@/pages/DocumentsPage"))
const SupportChatPage = lazy(() => import("@/pages/SupportChatPage"))
const ApprovalsPage = lazy(() => import("@/pages/ApprovalsPage"))
const LoginPage = lazy(() => import("@/pages/LoginPage"))
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))

/**
 * Tek gerçek kaynak: Menü + Rota tanımı
 * - path: MUTLAKA "/" ile başlasın (mutlak)
 * - roles: opsiyonel (örn. ["admin"])
 * - subs: alt menü/alt rota
 */

interface SubRouteItem {
  label: string
  path: string
  pageComponent: LazyExoticComponent<any>
  icon?: ComponentType
  roles?: readonly string[]
  /** Panel kabuğu (sidebar+header). Varsayılan: üst item veya true */
  hasNavbar?: boolean
  validateSearch?: (
    search: Record<string, unknown> & SearchSchemaInput,
  ) => Record<string, unknown>
}

export interface RouteMenuItem {
  label?: string
  path: string
  icon?: ComponentType
  pageComponent?: LazyExoticComponent<any>
  /** Sadece menü grubu; üst path için ayrı rota oluşturulmaz (alt `subs` kayıtları kullanılır) */
  navGroupOnly?: boolean
  subs?: SubRouteItem[]
  roles?: readonly string[]
  showInNav?: boolean
  /** Panel kabuğu (sidebar+header). Varsayılan: true. Auth/404 için false. */
  hasNavbar?: boolean
}

type RoutesAndMenuItems = readonly RouteMenuItem[]

export const routesAndMenuItems: RoutesAndMenuItems = [
  {
    label: "Ana Sayfa",
    path: "/",
    pageComponent: HomePage,
    showInNav: true,
    roles: ["admin", "user"],
    icon: Home,
  },
  {
    label: "Kullanıcılar",
    path: "/kullanicilar",
    pageComponent: UsersPage,
    showInNav: true,
    roles: ["admin"],
    icon: Users,
  },
  {
    label: "Ürünler",
    path: "/urunler",
    pageComponent: ProductsPage,
    showInNav: true,
    roles: ["admin", "user"],
    icon: Package,
  },
  {
    label: "Siparişler",
    path: "/siparisler",
    pageComponent: OrdersPage,
    showInNav: true,
    roles: ["admin", "user"],
    icon: ShoppingCart,
  },
  {
    label: "Ödemeler",
    path: "/odemeler",
    pageComponent: PaymentsPage,
    showInNav: true,
    roles: ["admin", "user"],
    icon: CreditCard,
  },
  {
    label: "Belgeler",
    path: "/belgeler",
    pageComponent: DocumentsPage,
    showInNav: true,
    roles: ["admin", "user"],
    icon: FileText,
  },
  {
    label: "Destek",
    path: "/destek",
    pageComponent: SupportChatPage,
    showInNav: true,
    roles: ["admin", "user"],
    icon: MessageCircle,
  },
  {
    label: "Onaylar",
    path: "/onaylar",
    pageComponent: ApprovalsPage,
    showInNav: true,
    roles: ["admin", "user"],
    icon: CheckSquare,
  },
  {
    label: "Giriş",
    path: "/login",
    pageComponent: LoginPage,
    showInNav: false,
    hasNavbar: false,
  },
  {
    label: "Şifre Sıfırlama",
    path: "/forgot-password",
    pageComponent: ForgotPasswordPage,
    showInNav: false,
    hasNavbar: false,
  },
  {
    label: "Catch All",
    path: "/$",
    pageComponent: NotFoundPage,
    showInNav: false,
    hasNavbar: false,
  },
] as const

/** Pathname için panel kabuğu (sidebar+header) gösterilsin mi? */
export function routeHasNavbar(pathname: string): boolean {
  for (const item of routesAndMenuItems) {
    if (item.subs?.length) {
      const sub = item.subs.find((s) => s.path === pathname)
      if (sub) {
        return sub.hasNavbar ?? item.hasNavbar ?? true
      }
    }

    if (item.path === pathname) {
      // Catch-all `/$` gerçek pathname ile eşleşmez; bilinmeyen path aşağıda false
      return item.hasNavbar ?? true
    }
  }

  // Eşleşmeyen path → NotFound (kabuksuz)
  return false
}

export type AppRouteItem = RouteMenuItem
