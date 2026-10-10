import api from "@/shared/api/client"
import type { DocumentType, RagDocument } from "@/shared/types/document"

export async function listDocuments(): Promise<RagDocument[]> {
  const { data } = await api.get<RagDocument[]>("/documents/")
  return data
}

export async function uploadDocument(
  file: File,
  documentType: DocumentType,
): Promise<RagDocument> {
  const form = new FormData()
  form.append("file", file)
  form.append("document_type", documentType)
  const { data } = await api.post<RagDocument>("/documents/", form)
  return data
}

export async function deleteDocument(documentId: number): Promise<void> {
  await api.delete(`/documents/${documentId}`)
}
