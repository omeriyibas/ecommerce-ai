import api from "@/shared/api/client"
import type {
  CreatePaymentPayload,
  Payment,
  UpdatePaymentPayload,
} from "@/shared/types/payment"

export async function listPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>("/payments/")
  return data
}

export async function createPayment(
  payload: CreatePaymentPayload,
): Promise<Payment> {
  const { data } = await api.post<Payment>("/payments/", payload)
  return data
}

export async function updatePayment(
  paymentId: number,
  payload: UpdatePaymentPayload,
): Promise<Payment> {
  const { data } = await api.put<Payment>(`/payments/${paymentId}`, payload)
  return data
}

export async function deletePayment(paymentId: number): Promise<void> {
  await api.delete(`/payments/${paymentId}`)
}
