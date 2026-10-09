import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { DEFAULT_PATHS } from "@/shared/config/paths.ts"

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

export function useLoginForm() {
  const navigate = useNavigate()
  const { login, loading, error, isAuthenticated } = useAuth()
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: DEFAULT_PATHS.APP, replace: true })
    }
  }, [isAuthenticated, navigate])

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, !!data.rememberMe)
      void navigate({ to: DEFAULT_PATHS.APP, replace: true })
    } catch {
      /* error authStore'da */
    }
  }

  return {
    form,
    onSubmit,
    loading,
    error,
    logoUrl,
  }
}
