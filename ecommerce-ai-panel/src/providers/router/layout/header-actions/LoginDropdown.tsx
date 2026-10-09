import { useEffect, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/features/auth/hooks/useAuth.tsx"
import ChangePasswordDialog from "@/features/auth/components/ChangePasswordDialog.tsx"
import { getPreferredTheme, setTheme, type ThemeMode } from "@/shared/theme/theme.ts"
import { ChevronDown, LogOut, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils.ts"

const LoginDropDown = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`
  const [theme, setThemeState] = useState<ThemeMode>(() => getPreferredTheme())
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const handleThemeToggle = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    setThemeState(nextTheme)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  if (!user) return null

  return (
    <div className="relative" ref={rootRef}>
      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSuccess={() => {
          void navigate({ to: "/login" })
        }}
      />
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <img
          className="h-8 w-8 rounded-full border border-white/20 bg-white object-contain"
          src={logoUrl}
          alt=""
        />
        <span className="hidden text-left xl:block">
          <span className="block font-medium leading-tight text-white">
            {user.name}
          </span>
          <span className="block text-xs text-white/70">{user.role}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-white/80 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-[100] mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-1 text-neutral-900 shadow-lg">
          <div className="px-3 py-2">
            <p className="text-sm font-medium leading-none text-neutral-900">
              {user.name}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-neutral-200" />
          <MenuItem
            onClick={() => {
              handleThemeToggle()
              setOpen(false)
            }}
          >
            {theme === "dark" ? (
              <Sun className="mr-2 size-4" />
            ) : (
              <Moon className="mr-2 size-4" />
            )}
            {theme === "dark" ? "Açık moda geç" : "Karanlık moda geç"}
          </MenuItem>
          <MenuItem
            className="text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false)
              void logout()
            }}
          >
            <LogOut className="mr-2 size-4" />
            Çıkış yap
          </MenuItem>
        </div>
      ) : null}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-100",
        className,
      )}
    >
      {children}
    </button>
  )
}

export default LoginDropDown
