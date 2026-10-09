import api from "@/shared/api/client"
import type { User, UserRole } from "@/shared/types/user"

export type UserListParams = {
  role?: UserRole
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
}

export async function listUsers(params?: UserListParams): Promise<User[]> {
  const { data } = await api.get<User[]>("/users/", {
    params: params?.role ? { role: params.role } : undefined,
  })
  return data
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<User>("/users/", payload)
  return data
}

export async function toggleUserActive(userId: number): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}/toggle-active`)
  return data
}
