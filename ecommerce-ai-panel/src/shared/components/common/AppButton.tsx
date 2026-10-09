import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils.ts"

type AppButtonVariant = "default" | "outline" | "ghost" | "destructive" | "secondary"
type AppButtonSize = "default" | "sm" | "lg" | "icon"

export type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant
  size?: AppButtonSize
  children?: ReactNode
}

const variantClass: Record<AppButtonVariant, string> = {
  default: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xs",
  outline:
    "border border-border bg-background hover:bg-accent/15 hover:text-foreground",
  ghost: "hover:bg-accent/15 hover:text-foreground",
  destructive: "bg-destructive text-white hover:bg-destructive/90 shadow-xs",
  secondary: "bg-primary text-primary-foreground hover:bg-primary/90",
}

const sizeClass: Record<AppButtonSize, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-sm",
  lg: "h-10 rounded-md px-6",
  icon: "size-9 p-0",
}

export function AppButton({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  )
}
