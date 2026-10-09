import { useMemo } from "react"
import CardListTable from "@/shared/components/table/CardListTable.tsx"
import type { ItemDetail } from "@/shared/types/ItemDetail"
import type { Order } from "@/shared/types/order"
import { useOrdersQuery } from "@/features/order/hooks/useOrderQueries.tsx"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

const statusLabel: Record<string, string> = {
  pending: "Beklemede",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  cancelled: "İptal",
}

const statusColor: Record<string, "amber" | "sky" | "emerald" | "gray"> = {
  pending: "amber",
  shipped: "sky",
  delivered: "emerald",
  cancelled: "gray",
}

const amountFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
})

type OrderListViewProps = {
  onEdit?: (itemId: string | number) => void
  onDelete?: (index: number) => void
}

export default function OrderListView({
  onEdit,
  onDelete,
}: OrderListViewProps) {
  const { data: orders = [], isLoading, error } = useOrdersQuery()

  const itemDetails = useMemo<ItemDetail[]>(
    () => [
      {
        title: "Ürün",
        dataKey: "product",
        rowType: "text",
        width: 46,
      },
      {
        title: "Tutar",
        dataKey: "amount",
        rowType: "text",
        width: 24,
        align: "center",
        noTruncate: true,
        formatter: (value) => amountFormatter.format(Number(value ?? 0)),
      },
      {
        title: "Durum",
        dataKey: "status",
        rowType: "badge",
        width: 30,
        align: "center",
        formatter: (value) => {
          const key = String(value ?? "")
          return {
            text: statusLabel[key] ?? key,
            color: statusColor[key] ?? "slate",
          }
        },
      },
    ],
    [],
  )

  return (
    <CardListTable<Order>
      items={orders}
      itemDetails={itemDetails}
      loading={isLoading}
      error={
        error ? getApiErrorMessage(error, "Siparişler yüklenemedi") : null
      }
      emptyMessage="Henüz sipariş yok."
      listMaxHeight="70vh"
      editHandle={onEdit}
      removeHandle={onDelete}
    />
  )
}
