import type { User } from "@/shared/types/user"

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface TokenResult {
  access_token: string
  refresh_token?: string
  token_type?: string
}

export interface LoginResponse {
  user: User
  token: TokenResult
}
