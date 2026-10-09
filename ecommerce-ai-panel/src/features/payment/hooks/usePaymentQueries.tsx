import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createPayment,
  deletePayment,
  listPayments,
  updatePayment,
} from "@/services/payments.tsx"
import type {
  CreatePaymentPayload,
  UpdatePaymentPayload,
} from "@/shared/types/payment"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

export const paymentQueryKeys = {
  all: ["payments"] as const,
  list: () => ["payments", "list"] as const,
}

export function usePaymentsQuery() {
  return useQuery({
    queryKey: paymentQueryKeys.list(),
    queryFn: () => listPayments(),
  })
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => createPayment(payload),
    onSuccess: (payment) => {
      void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.all })
      toast.success(`Ödeme #${payment.id} oluşturuldu`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Ödeme oluşturulamadı"))
    },
  })
}

export function useUpdatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdatePaymentPayload
    }) => updatePayment(id, payload),
    onSuccess: (payment) => {
      void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.all })
      toast.success(`Ödeme #${payment.id} güncellendi`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Ödeme güncellenemedi"))
    },
  })
}

export function useDeletePaymentMutation() {
  return useMutation({
    mutationFn: (paymentId: number) => deletePayment(paymentId),
  })
}
