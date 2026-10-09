import { Plus } from "lucide-react"
import PaymentListView from "@/features/payment/components/PaymentListView.tsx"
import CreatePaymentDialog from "@/features/payment/components/CreatePaymentDialog.tsx"
import ConfirmationModal from "@/shared/components/modal/ConfirmationModal.tsx"
import { AppButton } from "@/shared/components/common/AppButton.tsx"
import { useCrudListHandlers } from "@/shared/hooks/useCrudListHandlers.ts"
import {
  paymentQueryKeys,
  usePaymentsQuery,
} from "@/features/payment/hooks/usePaymentQueries.tsx"
import { deletePayment } from "@/services/payments.tsx"
import type { Payment } from "@/shared/types/payment"

export default function PaymentsPage() {
  const { data: payments = [] } = usePaymentsQuery()
  const handlers = useCrudListHandlers<Payment>({
    queryKeys: [paymentQueryKeys.all],
    deleteFn: deletePayment,
    messages: {
      deleteSuccess: "Ödeme silindi",
      deleteError: "Ödeme silinemedi",
    },
  })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Ödemeler
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ödemelerinizi oluşturun, düzenleyin veya silin.
          </p>
        </div>
        <AppButton
          variant="secondary"
          className="shrink-0"
          onClick={handlers.openNew}
        >
          <Plus className="size-4" />
          Ödeme oluştur
        </AppButton>
      </div>

      <CreatePaymentDialog
        open={handlers.modalIsOpen}
        onClose={handlers.handleModalClose}
        payment={handlers.editing}
      />

      <ConfirmationModal
        isOpen={handlers.confirmationModal.isOpen}
        onClose={handlers.handleConfirmationClose}
        onConfirm={handlers.handleConfirmationConfirm}
        title="Silme onayı"
        message={
          handlers.confirmationModal.item
            ? `Sipariş #${handlers.confirmationModal.item.order_id} ödemesi silinsin mi?`
            : "Ödeme silinsin mi?"
        }
        confirmText="Sil"
        cancelText="İptal"
      />

      <PaymentListView
        onEdit={(itemId) => handlers.handleEdit(itemId, payments)}
        onDelete={(index) => handlers.handleDelete(index, payments)}
      />
    </div>
  )
}
