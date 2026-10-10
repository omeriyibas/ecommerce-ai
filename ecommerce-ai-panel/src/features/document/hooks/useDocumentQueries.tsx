import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
} from "@/services/documents.tsx"
import type { DocumentType } from "@/shared/types/document"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

export const documentQueryKeys = {
  all: ["documents"] as const,
  list: () => ["documents", "list"] as const,
}

export function useDocumentsQuery() {
  return useQuery({
    queryKey: documentQueryKeys.list(),
    queryFn: () => listDocuments(),
  })
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      documentType,
    }: {
      file: File
      documentType: DocumentType
    }) => uploadDocument(file, documentType),
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({ queryKey: documentQueryKeys.all })
      toast.success(`${doc.name} yüklendi (${doc.chunk_count} parça)`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Belge yüklenemedi"))
    },
  })
}

export function useDeleteDocumentMutation() {
  return useMutation({
    mutationFn: (documentId: number) => deleteDocument(documentId),
  })
}
