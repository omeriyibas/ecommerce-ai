import AccessTokenCard from "@/features/auth/components/AccessTokenCard.tsx"
import { useAuth } from "@/features/auth/hooks/useAuth.tsx"

const HomePage = () => {
  const { user } = useAuth()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Shopiva"
          className="mb-4 h-20 w-auto object-contain"
        />
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Merhaba{user?.name ? `, ${user.name}` : ""}
        </h2>
        <p className="mt-1 text-muted-foreground">
          Oturum açık. Domain sayfaları sonra eklenecek.
        </p>
      </div>
      <AccessTokenCard />
    </div>
  )
}

export default HomePage
