import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  type CreateProductPayload,
  type UpdateProductPayload,
} from "@/services/products.tsx"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

export const productQueryKeys = {
  all: ["products"] as const,
  list: () => ["products", "list"] as const,
}

export function useProductsQuery() {
  return useQuery({
    queryKey: productQueryKeys.list(),
    queryFn: () => listProducts(),
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.all })
      toast.success(`${product.name} eklendi`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Ürün eklenemedi"))
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateProductPayload
    }) => updateProduct(id, payload),
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.all })
      toast.success(`${product.name} güncellendi`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Ürün güncellenemedi"))
    },
  })
}

export function useDeleteProductMutation() {
  return useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
  })
}
