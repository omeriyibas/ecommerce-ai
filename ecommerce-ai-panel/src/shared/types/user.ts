export type UserRole = "admin" | "user"

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  is_active?: boolean | null
}
