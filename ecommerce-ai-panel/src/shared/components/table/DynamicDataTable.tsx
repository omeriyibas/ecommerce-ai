import type { ReactNode } from "react"
import { cn } from "@/lib/utils.ts"

export interface DynamicColumn<T> {
  key: string
  title: string
  className?: string
  render: (row: T) => ReactNode
}

interface DynamicDataTableProps<T> {
  columns: DynamicColumn<T>[]
  rows: T[] | undefined
  isLoading?: boolean
  emptyMessage?: string
  colSpan?: number
}

export default function DynamicDataTable<T>({
  columns,
  rows,
  isLoading = false,
  emptyMessage = "Kayıt yok.",
  colSpan,
}: DynamicDataTableProps<T>) {
  const span = colSpan ?? columns.length
  return (
    <div className="w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "h-10 px-2 text-left align-middle font-medium text-muted-foreground",
                  col.className,
                )}
              >
                <span className="font-semibold">{col.title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {isLoading ? (
            <tr className="border-b">
              <td
                colSpan={span}
                className="p-2 text-center align-middle text-muted-foreground"
              >
                Yükleniyor…
              </td>
            </tr>
          ) : !rows?.length ? (
            <tr className="border-b">
              <td
                colSpan={span}
                className="p-2 text-center align-middle text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("p-2 align-middle", col.className)}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
