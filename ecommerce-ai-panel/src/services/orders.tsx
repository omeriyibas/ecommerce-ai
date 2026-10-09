import api from "@/shared/api/client"
import type { CreateOrderPayload, Order, OrderStatus } from "@/shared/types/order"

export type UpdateOrderPayload = {
  product_id: number
  status: OrderStatus
}

export async function listOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/orders/")
  return data
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<Order>("/orders/", payload)
  return data
}

export async function updateOrder(
  orderId: number,
  payload: UpdateOrderPayload,
): Promise<Order> {
  const { data } = await api.put<Order>(`/orders/${orderId}`, payload)
  return data
}

export async function deleteOrder(orderId: number): Promise<void> {
  await api.delete(`/orders/${orderId}`)
}
