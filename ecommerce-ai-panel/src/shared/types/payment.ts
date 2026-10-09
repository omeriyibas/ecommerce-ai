export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface Payment {
  id: number
  order_id: number
  user_id: number
  amount: number
  status: PaymentStatus | string
}

export type CreatePaymentPayload = {
  order_id: number
  status?: PaymentStatus
}

export type UpdatePaymentPayload = {
  order_id: number
  status: PaymentStatus
}
