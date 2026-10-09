import api from "@/shared/api/client"
import type { Product } from "@/shared/types/product"

export type CreateProductPayload = {
  name: string
  price: number
  description?: string
}

export type UpdateProductPayload = CreateProductPayload

export async function listProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/products/")
  return data
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<Product> {
  const { data } = await api.post<Product>("/products/", payload)
  return data
}

export async function updateProduct(
  productId: number,
  payload: UpdateProductPayload,
): Promise<Product> {
  const { data } = await api.put<Product>(`/products/${productId}`, payload)
  return data
}

export async function deleteProduct(productId: number): Promise<void> {
  await api.delete(`/products/${productId}`)
}
