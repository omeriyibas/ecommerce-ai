import { AppButton } from "@/shared/components/common/AppButton.tsx"
import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/shared/components/common/AppCard.tsx"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <AppCard className="w-full max-w-md">
        <AppCardHeader className="text-center">
          <AppCardTitle className="text-6xl font-bold text-gray-900">404</AppCardTitle>
          <AppCardDescription className="text-xl text-gray-600">
            Sayfa bulunamadı
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="text-center">
          <p className="mb-6 text-gray-600">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
          <AppButton className="w-full" onClick={() => { window.location.href = "/" }}>
            Ana Sayfaya Dön
          </AppButton>
        </AppCardContent>
      </AppCard>
    </div>
  )
}
