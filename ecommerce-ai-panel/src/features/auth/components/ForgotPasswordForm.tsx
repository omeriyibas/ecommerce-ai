import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { forgotPassword } from "@/services/auth.tsx"
import { AppButton } from "@/shared/components/common/AppButton.tsx"
import { AppInput } from "@/shared/components/common/AppInput.tsx"
import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/shared/components/common/AppCard.tsx"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"
import { toast } from "sonner"

const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setSubmitting(true)
    try {
      await forgotPassword(data.email.trim())
      setSent(true)
      toast.success(
        "Kayıtlı bir hesap varsa şifre sıfırlama e-postası gönderildi.",
      )
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "İstek gönderilemedi. Lütfen tekrar deneyin."),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <AppCard className="w-full max-w-md">
        <AppCardHeader>
          <AppCardTitle className="text-center text-2xl font-bold">
            Şifremi Unuttum
          </AppCardTitle>
          <AppCardDescription className="text-center">
            Panel hesabınıza kayıtlı e-posta adresinizi girin; geçici şifre
            gönderilecektir.
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent>
          {sent ? (
            <p className="text-center text-sm text-muted-foreground">
              E-postanızı kontrol edin. Giriş için{" "}
              <a href="/login" className="text-primary hover:underline">
                giriş sayfasına
              </a>{" "}
              dönebilirsiniz.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">E-posta</label>
                <AppInput
                  type="email"
                  placeholder="ornek@email.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                ) : null}
              </div>
              <AppButton type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Gönderiliyor…" : "Şifre Sıfırlama E-postası Gönder"}
              </AppButton>
            </form>
          )}
          {!sent ? (
            <div className="mt-4 text-center">
              <a href="/login" className="text-primary hover:underline">
                Giriş sayfasına dön
              </a>
            </div>
          ) : null}
        </AppCardContent>
      </AppCard>
    </div>
  )
}
