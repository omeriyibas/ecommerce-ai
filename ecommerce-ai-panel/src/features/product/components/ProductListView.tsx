import { useMemo } from "react"
import CardListTable from "@/shared/components/table/CardListTable.tsx"
import type { ItemDetail } from "@/shared/types/ItemDetail"
import type { Product } from "@/shared/types/product"
import { useProductsQuery } from "@/features/product/hooks/useProductQueries.tsx"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
})

type ProductListViewProps = {
  onEdit?: (itemId: string | number) => void
  onDelete?: (index: number) => void
}

export default function ProductListView({
  onEdit,
  onDelete,
}: ProductListViewProps) {
  const { data: products = [], isLoading, error } = useProductsQuery()

  const itemDetails = useMemo<ItemDetail[]>(
    () => [
      {
        title: "Ürün",
        dataKey: "name",
        rowType: "text",
        width: 32,
      },
      {
        title: "Fiyat",
        dataKey: "price",
        rowType: "text",
        width: 16,
        align: "center",
        noTruncate: true,
        formatter: (value) => priceFormatter.format(Number(value ?? 0)),
      },
      {
        title: "Açıklama",
        dataKey: "description",
        rowType: "text",
        width: 52,
        formatter: (value) => {
          const text = String(value ?? "").trim()
          return text || "—"
        },
      },
    ],
    [],
  )

  return (
    <CardListTable<Product>
      items={products}
      itemDetails={itemDetails}
      loading={isLoading}
      error={
        error ? getApiErrorMessage(error, "Ürünler yüklenemedi") : null
      }
      emptyMessage="Henüz ürün yok."
      listMaxHeight="70vh"
      editHandle={onEdit}
      removeHandle={onDelete}
    />
  )
}
