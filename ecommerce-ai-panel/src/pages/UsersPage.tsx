import { useState } from "react"
import { Plus } from "lucide-react"
import UserListView from "@/features/user/components/UserListView.tsx"
import CreateUserDialog from "@/features/user/components/CreateUserDialog.tsx"
import { AppButton } from "@/shared/components/common/AppButton.tsx"

export default function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Kullanıcılar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Panel kullanıcılarını ekleyin ve aktiflik durumunu yönetin.
          </p>
        </div>
        <AppButton
          variant="secondary"
          className="shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          Kullanıcı ekle
        </AppButton>
      </div>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <UserListView />
    </div>
  )
}
