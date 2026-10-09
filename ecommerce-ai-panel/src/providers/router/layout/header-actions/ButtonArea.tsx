import LoginDropDown from "@/providers/router/layout/header-actions/LoginDropdown.tsx"
import { useAuth } from "@/features/auth/hooks/useAuth"

const ButtonArea = () => {
  const { user } = useAuth()

  if (!user) return null

  return <LoginDropDown />
}

export default ButtonArea
