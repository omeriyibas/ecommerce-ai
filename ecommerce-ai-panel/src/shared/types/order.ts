export type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled"

export interface Order {
  id: number
  user_id: number
  product_id: number
  product: string
  amount: number
  status: OrderStatus | string
}

export type CreateOrderPayload = {
  product_id: number
  status?: OrderStatus
}
