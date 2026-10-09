import { Link } from "@tanstack/react-router"
import { AppButton } from "@/shared/components/common/AppButton.tsx"
import { AppInput } from "@/shared/components/common/AppInput.tsx"
import { AppCheckbox } from "@/shared/components/common/AppCheckbox.tsx"
import { useLoginForm } from "@/features/auth/hooks/useLoginForm"
import { DEFAULT_PATHS } from "@/shared/config/paths.ts"

export default function LoginForm() {
  const { form, onSubmit, loading, error, logoUrl } = useLoginForm()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form
  const rememberMe = watch("rememberMe")

  return (
    <section className="flex min-h-screen flex-wrap justify-center bg-white text-neutral-900">
      <div className="flex flex-col justify-center px-6 py-8 lg:w-1/2">
        <div className="mx-auto w-full lg:max-w-[464px]">
          <div className="mb-8 flex justify-center">
            <img
              src={logoUrl}
              alt="Shopiva"
              className="h-36 w-auto max-w-full object-contain"
            />
          </div>
          <div>
            <h4 className="mb-3 text-4xl font-semibold text-neutral-900">
              Hesabınıza Giriş Yapın
            </h4>
            <p className="mb-8 text-lg text-neutral-500">
              Hoş geldiniz! Lütfen bilgilerinizi girin
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : null}
            <div>
              <AppInput
                type="email"
                placeholder="E-posta"
                className="h-14 rounded-xl border-neutral-300 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email ? (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <AppInput
                type="password"
                placeholder="Şifre"
                className="h-14 rounded-xl border-neutral-300 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password ? (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              ) : null}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <AppCheckbox
                checked={Boolean(rememberMe)}
                onChange={(e) => setValue("rememberMe", e.target.checked)}
                label="Beni hatırla"
                className="text-md text-neutral-700"
              />
              <Link
                to={DEFAULT_PATHS.FORGOT_PASSWORD}
                className="text-sm font-medium text-[#FF6A00] hover:underline"
              >
                Şifremi unuttum
              </Link>
            </div>
            <AppButton
              type="submit"
              disabled={loading}
              className="mt-4 h-auto w-full rounded-xl bg-[#FF6A00] px-4 py-4 text-sm font-semibold text-white hover:bg-[#FF6A00]/90"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </AppButton>
          </form>
        </div>
      </div>
    </section>
  )
}
