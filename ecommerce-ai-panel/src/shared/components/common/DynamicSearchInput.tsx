import { Search } from "lucide-react"
import { AppInput } from "@/shared/components/common/AppInput.tsx"
import { cn } from "@/lib/utils.ts"

interface DynamicSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
}

export default function DynamicSearchInput({
  value,
  onChange,
  placeholder = "Arama...",
  className,
  inputClassName,
}: DynamicSearchInputProps) {
  return (
    <div className={className ?? "relative max-w-md"}>
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <AppInput
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("h-9 pl-9", inputClassName)}
        autoComplete="off"
      />
    </div>
  )
}
