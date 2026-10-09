import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createOrder,
  deleteOrder,
  listOrders,
  updateOrder,
  type UpdateOrderPayload,
} from "@/services/orders.tsx"
import type { CreateOrderPayload } from "@/shared/types/order"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

export const orderQueryKeys = {
  all: ["orders"] as const,
  list: () => ["orders", "list"] as const,
}

export function useOrdersQuery() {
  return useQuery({
    queryKey: orderQueryKeys.list(),
    queryFn: () => listOrders(),
  })
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
      toast.success(`Sipariş #${order.id} oluşturuldu`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Sipariş oluşturulamadı"))
    },
  })
}

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateOrderPayload
    }) => updateOrder(id, payload),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
      toast.success(`Sipariş #${order.id} güncellendi`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Sipariş güncellenemedi"))
    },
  })
}

export function useDeleteOrderMutation() {
  return useMutation({
    mutationFn: (orderId: number) => deleteOrder(orderId),
  })
}
