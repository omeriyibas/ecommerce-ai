import type { ReactNode } from "react"
import { cn } from "@/lib/utils.ts"
import { AppSwitch } from "@/shared/components/common/AppSwitch.tsx"

export type LabeledSwitchProps = {
  id: string
  label: ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  switchClassName?: string
  labelClassName?: string
}

export function LabeledSwitch({
  id,
  label,
  checked = false,
  onCheckedChange,
  disabled,
  className,
  switchClassName,
  labelClassName,
}: LabeledSwitchProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <AppSwitch
        id={id}
        className={switchClassName}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <label htmlFor={id} className={cn("text-sm font-medium", labelClassName)}>
        {label}
      </label>
    </div>
  )
}
