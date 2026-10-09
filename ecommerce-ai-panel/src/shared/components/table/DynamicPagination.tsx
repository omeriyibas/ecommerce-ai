import { AppButton } from "@/shared/components/common/AppButton.tsx"

interface DynamicPaginationProps {
  total: number
  page: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
  perPage?: number
  perPageOptions?: number[]
  onPerPageChange?: (value: number) => void
  isLoading?: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}

export default function DynamicPagination({
  total,
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  perPage,
  perPageOptions = [10, 20, 25, 50, 100],
  onPerPageChange,
  isLoading = false,
  onPrev,
  onNext,
  className,
}: DynamicPaginationProps) {
  if (total <= 0) return null

  return (
    <div
      className={
        className ??
        "flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"
      }
    >
      <span>
        Toplam {total.toLocaleString("tr-TR")} kayıt — sayfa {page} / {totalPages}
      </span>
      <div className="flex items-center gap-2">
        {onPerPageChange ? (
          <label className="flex items-center gap-2 text-xs sm:text-sm">
            <span>Sayfa başına</span>
            <select
              className="h-8 rounded-md border border-border bg-background px-2 text-xs sm:text-sm"
              value={perPage ?? perPageOptions[0]}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              disabled={isLoading}
            >
              {perPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrevPage || isLoading}
          onClick={onPrev}
        >
          Önceki
        </AppButton>
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNextPage || isLoading}
          onClick={onNext}
        >
          Sonraki
        </AppButton>
      </div>
    </div>
  )
}
