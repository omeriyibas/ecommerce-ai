import { useMemo } from "react"
import CardListTable from "@/shared/components/table/CardListTable.tsx"
import type { ItemDetail } from "@/shared/types/ItemDetail"
import type { RagDocument } from "@/shared/types/document"
import { DOCUMENT_TYPE_LABELS } from "@/shared/types/document"
import { useDocumentsQuery } from "@/features/document/hooks/useDocumentQueries.tsx"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

type DocumentListViewProps = {
  onDelete?: (index: number) => void
}

export default function DocumentListView({ onDelete }: DocumentListViewProps) {
  const { data: documents = [], isLoading, error } = useDocumentsQuery()

  const itemDetails = useMemo<ItemDetail[]>(
    () => [
      {
        title: "Dosya",
        dataKey: "name",
        rowType: "text",
        width: 40,
      },
      {
        title: "Tür",
        dataKey: "document_type",
        rowType: "text",
        width: 20,
        align: "center",
        formatter: (value) =>
          DOCUMENT_TYPE_LABELS[value as RagDocument["document_type"]] ??
          String(value ?? "—"),
      },
      {
        title: "Parça",
        dataKey: "chunk_count",
        rowType: "text",
        width: 16,
        align: "center",
        noTruncate: true,
      },
      {
        title: "Id",
        dataKey: "id",
        rowType: "text",
        width: 12,
        align: "center",
        noTruncate: true,
      },
    ],
    [],
  )

  return (
    <CardListTable<RagDocument>
      items={documents}
      itemDetails={itemDetails}
      loading={isLoading}
      error={
        error ? getApiErrorMessage(error, "Belgeler yüklenemedi") : null
      }
      emptyMessage="Henüz belge yok. PDF ekleyerek RAG bilgi bankasını doldurun."
      listMaxHeight="70vh"
      removeHandle={onDelete}
    />
  )
}
