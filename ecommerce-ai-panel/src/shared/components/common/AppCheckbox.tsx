import type { InputHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils.ts"

export type AppCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: ReactNode
}

export function AppCheckbox({
  className,
  label,
  id,
  ...props
}: AppCheckboxProps) {
  const inputId = id ?? (typeof label === "string" ? label : undefined)

  return (
    <label
      htmlFor={inputId}
      className={cn("inline-flex cursor-pointer items-center gap-2 text-sm", className)}
    >
      <input
        id={inputId}
        type="checkbox"
        className="size-4 rounded border border-input accent-primary"
        {...props}
      />
      {label ? <span>{label}</span> : null}
    </label>
  )
}
