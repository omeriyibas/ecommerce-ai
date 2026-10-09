import { useMemo } from "react"
import { toast } from "sonner"
import CardListTable from "@/shared/components/table/CardListTable.tsx"
import type { ItemDetail } from "@/shared/types/ItemDetail"
import type { User } from "@/shared/types/user"
import {
  useToggleUserActiveMutation,
  useUsersQuery,
} from "@/features/user/hooks/useUserQueries.tsx"
import { useAuth } from "@/features/auth/hooks/useAuth.tsx"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

const roleLabel: Record<string, string> = {
  admin: "Admin",
  user: "Kullanıcı",
}

export default function UserListView() {
  const { user: currentUser } = useAuth()
  const { data: users = [], isLoading, error } = useUsersQuery("user")
  const toggleMutation = useToggleUserActiveMutation()

  const itemDetails = useMemo<ItemDetail[]>(
    () => [
      {
        title: "ID",
        dataKey: "id",
        rowType: "text",
        width: 8,
        noTruncate: true,
      },
      {
        title: "Ad",
        dataKey: "name",
        rowType: "text",
        width: 26,
        formatter: (value, item) => {
          const name = String(value ?? "")
          if (item && currentUser?.id === item.id) {
            return `${name} (siz)`
          }
          return name
        },
      },
      {
        title: "E-posta",
        dataKey: "email",
        rowType: "text",
        width: 36,
      },
      {
        title: "Rol",
        dataKey: "role",
        rowType: "badge",
        width: 16,
        align: "center",
        formatter: (value) => ({
          text: roleLabel[String(value)] ?? String(value),
          color: value === "admin" ? "orange" : "slate",
        }),
      },
      {
        title: "Aktif",
        dataKey: "is_active",
        rowType: "switch",
        width: 14,
        align: "center",
        onToggle: (itemId) => {
          if (currentUser?.id === Number(itemId)) {
            toast.error("Kendi hesabınızı pasife alamazsınız")
            return
          }
          toggleMutation.mutate(Number(itemId))
        },
      },
    ],
    [currentUser?.id, toggleMutation],
  )

  return (
    <CardListTable<User>
      items={users}
      itemDetails={itemDetails}
      loading={isLoading}
      error={
        error
          ? getApiErrorMessage(error, "Kullanıcılar yüklenemedi")
          : null
      }
      emptyMessage="Henüz kullanıcı yok."
      listMaxHeight="70vh"
    />
  )
}
