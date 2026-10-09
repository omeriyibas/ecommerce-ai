import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils.ts"

export type AppCardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode
}

export function AppCard({ className, ...props }: AppCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-xs",
        className,
      )}
      {...props}
    />
  )
}

export function AppCardHeader({ className, ...props }: AppCardProps) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
}

export function AppCardTitle({ className, ...props }: AppCardProps) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none", className)} {...props} />
  )
}

export function AppCardDescription({ className, ...props }: AppCardProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
}

export function AppCardContent({ className, ...props }: AppCardProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}
