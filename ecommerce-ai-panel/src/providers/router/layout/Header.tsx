import { useSelector } from "react-redux"
import type { RootState } from "@/providers/store/store.tsx"
import ButtonArea from "@/providers/router/layout/header-actions/ButtonArea.tsx"

const Header = () => {
  const pageTitle = useSelector((state: RootState) => state.ui.pageTitle)

  return (
    <div className="fixed top-0 right-0 left-80 z-40 flex h-20 items-center bg-primary">
      <div className="relative flex h-full w-full min-w-0 items-center justify-center px-6">
        <h1 className="truncate px-40 text-xl text-white">{pageTitle}</h1>
        <div className="absolute right-6 top-1/2 z-50 flex -translate-y-1/2 shrink-0 items-center">
          <ButtonArea />
        </div>
      </div>
    </div>
  )
}

export default Header
