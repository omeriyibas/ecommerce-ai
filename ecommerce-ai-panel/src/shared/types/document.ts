export type DocumentType =
  | "urun"
  | "kargo"
  | "iade"
  | "odeme"
  | "garanti"
  | "destek"
  | "genel"

export type RagDocument = {
  id: number
  name: string
  document_type: DocumentType
  chunk_count: number
}

export const DOCUMENT_TYPE_OPTIONS: { label: string; value: DocumentType }[] = [
  { label: "Genel", value: "genel" },
  { label: "Ürün", value: "urun" },
  { label: "Kargo", value: "kargo" },
  { label: "İade", value: "iade" },
  { label: "Ödeme", value: "odeme" },
  { label: "Garanti", value: "garanti" },
  { label: "Destek", value: "destek" },
]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  genel: "Genel",
  urun: "Ürün",
  kargo: "Kargo",
  iade: "İade",
  odeme: "Ödeme",
  garanti: "Garanti",
  destek: "Destek",
}
