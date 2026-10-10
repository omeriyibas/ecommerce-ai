import { Plus } from "lucide-react"
import DocumentListView from "@/features/document/components/DocumentListView.tsx"
import UploadDocumentDialog from "@/features/document/components/UploadDocumentDialog.tsx"
import ConfirmationModal from "@/shared/components/modal/ConfirmationModal.tsx"
import { AppButton } from "@/shared/components/common/AppButton.tsx"
import { useCrudListHandlers } from "@/shared/hooks/useCrudListHandlers.ts"
import {
  documentQueryKeys,
  useDocumentsQuery,
} from "@/features/document/hooks/useDocumentQueries.tsx"
import { deleteDocument } from "@/services/documents.tsx"
import type { RagDocument } from "@/shared/types/document"

export default function DocumentsPage() {
  const { data: documents = [] } = useDocumentsQuery()
  const handlers = useCrudListHandlers<RagDocument>({
    queryKeys: [documentQueryKeys.all],
    deleteFn: deleteDocument,
    messages: {
      deleteSuccess: "Belge silindi",
      deleteError: "Belge silinemedi",
    },
  })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Belgeler
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Destek asistanının RAG bilgi bankası için PDF yükleyin veya silin.
          </p>
        </div>
        <AppButton
          variant="secondary"
          className="shrink-0"
          onClick={handlers.openNew}
        >
          <Plus className="size-4" />
          Belge ekle
        </AppButton>
      </div>

      <UploadDocumentDialog
        open={handlers.modalIsOpen}
        onClose={handlers.handleModalClose}
      />

      <ConfirmationModal
        isOpen={handlers.confirmationModal.isOpen}
        onClose={handlers.handleConfirmationClose}
        onConfirm={handlers.handleConfirmationConfirm}
        title="Silme onayı"
        message={
          handlers.confirmationModal.item
            ? `"${handlers.confirmationModal.item.name}" silinsin mi?`
            : "Belge silinsin mi?"
        }
        confirmText="Sil"
        cancelText="İptal"
      />

      <DocumentListView
        onDelete={(index) => handlers.handleDelete(index, documents)}
      />
    </div>
  )
}
