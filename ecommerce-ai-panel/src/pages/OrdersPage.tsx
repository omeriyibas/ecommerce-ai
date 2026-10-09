import { Plus } from "lucide-react"
import OrderListView from "@/features/order/components/OrderListView.tsx"
import CreateOrderDialog from "@/features/order/components/CreateOrderDialog.tsx"
import ConfirmationModal from "@/shared/components/modal/ConfirmationModal.tsx"
import { AppButton } from "@/shared/components/common/AppButton.tsx"
import { useCrudListHandlers } from "@/shared/hooks/useCrudListHandlers.ts"
import {
  orderQueryKeys,
  useOrdersQuery,
} from "@/features/order/hooks/useOrderQueries.tsx"
import { deleteOrder } from "@/services/orders.tsx"
import type { Order } from "@/shared/types/order"

export default function OrdersPage() {
  const { data: orders = [] } = useOrdersQuery()
  const handlers = useCrudListHandlers<Order>({
    queryKeys: [orderQueryKeys.all],
    deleteFn: deleteOrder,
    messages: {
      deleteSuccess: "Sipariş silindi",
      deleteError: "Sipariş silinemedi",
    },
  })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Siparişler
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Siparişlerinizi oluşturun, düzenleyin veya silin.
          </p>
        </div>
        <AppButton
          variant="secondary"
          className="shrink-0"
          onClick={handlers.openNew}
        >
          <Plus className="size-4" />
          Sipariş oluştur
        </AppButton>
      </div>

      <CreateOrderDialog
        open={handlers.modalIsOpen}
        onClose={handlers.handleModalClose}
        order={handlers.editing}
      />

      <ConfirmationModal
        isOpen={handlers.confirmationModal.isOpen}
        onClose={handlers.handleConfirmationClose}
        onConfirm={handlers.handleConfirmationConfirm}
        title="Silme onayı"
        message={
          handlers.confirmationModal.item
            ? `"${handlers.confirmationModal.item.product}" siparişi silinsin mi?`
            : "Sipariş silinsin mi?"
        }
        confirmText="Sil"
        cancelText="İptal"
      />

      <OrderListView
        onEdit={(itemId) => handlers.handleEdit(itemId, orders)}
        onDelete={(index) => handlers.handleDelete(index, orders)}
      />
    </div>
  )
}
