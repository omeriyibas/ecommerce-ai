import { useMemo } from "react"
import CardListTable from "@/shared/components/table/CardListTable.tsx"
import type { ItemDetail } from "@/shared/types/ItemDetail"
import type { Payment } from "@/shared/types/payment"
import { usePaymentsQuery } from "@/features/payment/hooks/usePaymentQueries.tsx"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

const statusLabel: Record<string, string> = {
  pending: "Beklemede",
  paid: "Ödendi",
  failed: "Başarısız",
  refunded: "İade",
}

const statusColor: Record<
  string,
  "amber" | "emerald" | "red" | "sky" | "gray"
> = {
  pending: "amber",
  paid: "emerald",
  failed: "red",
  refunded: "sky",
}

type PaymentListViewProps = {
  onEdit?: (itemId: string | number) => void
  onDelete?: (index: number) => void
}

export default function PaymentListView({
  onEdit,
  onDelete,
}: PaymentListViewProps) {
  const { data: payments = [], isLoading, error } = usePaymentsQuery()

  const itemDetails = useMemo<ItemDetail[]>(
    () => [
      {
        title: "Sipariş",
        dataKey: "order_id",
        rowType: "text",
        width: 50,
        formatter: (value) => `#${value}`,
      },
      {
        title: "Durum",
        dataKey: "status",
        rowType: "badge",
        width: 50,
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
    <CardListTable<Payment>
      items={payments}
      itemDetails={itemDetails}
      loading={isLoading}
      error={
        error ? getApiErrorMessage(error, "Ödemeler yüklenemedi") : null
      }
      emptyMessage="Henüz ödeme yok."
      listMaxHeight="70vh"
      editHandle={onEdit}
      removeHandle={onDelete}
    />
  )
}
