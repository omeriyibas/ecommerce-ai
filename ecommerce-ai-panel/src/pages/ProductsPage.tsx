import { Plus } from "lucide-react"
import ProductListView from "@/features/product/components/ProductListView.tsx"
import CreateProductDialog from "@/features/product/components/CreateProductDialog.tsx"
import ConfirmationModal from "@/shared/components/modal/ConfirmationModal.tsx"
import { AppButton } from "@/shared/components/common/AppButton.tsx"
import { useCrudListHandlers } from "@/shared/hooks/useCrudListHandlers.ts"
import {
  productQueryKeys,
  useProductsQuery,
} from "@/features/product/hooks/useProductQueries.tsx"
import { deleteProduct } from "@/services/products.tsx"
import type { Product } from "@/shared/types/product"

export default function ProductsPage() {
  const { data: products = [] } = useProductsQuery()
  const handlers = useCrudListHandlers<Product>({
    queryKeys: [productQueryKeys.all],
    deleteFn: deleteProduct,
    messages: {
      deleteSuccess: "Ürün silindi",
      deleteError: "Ürün silinemedi",
    },
  })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Ürünler
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Katalogdaki ürünleri ekleyin, düzenleyin veya silin.
          </p>
        </div>
        <AppButton
          variant="secondary"
          className="shrink-0"
          onClick={handlers.openNew}
        >
          <Plus className="size-4" />
          Ürün ekle
        </AppButton>
      </div>

      <CreateProductDialog
        open={handlers.modalIsOpen}
        onClose={handlers.handleModalClose}
        product={handlers.editing}
      />

      <ConfirmationModal
        isOpen={handlers.confirmationModal.isOpen}
        onClose={handlers.handleConfirmationClose}
        onConfirm={handlers.handleConfirmationConfirm}
        title="Silme onayı"
        message={
          handlers.confirmationModal.item
            ? `"${handlers.confirmationModal.item.name}" silinsin mi?`
            : "Ürün silinsin mi?"
        }
        confirmText="Sil"
        cancelText="İptal"
      />

      <ProductListView
        onEdit={(itemId) => handlers.handleEdit(itemId, products)}
        onDelete={(index) => handlers.handleDelete(index, products)}
      />
    </div>
  )
}
