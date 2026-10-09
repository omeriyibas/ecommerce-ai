import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils.ts"

export type AppInputProps = InputHTMLAttributes<HTMLInputElement>

export function AppInput({ className, type = "text", ...props }: AppInputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground outline-none transition",
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}
