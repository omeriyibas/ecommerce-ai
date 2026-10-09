import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createUser,
  listUsers,
  toggleUserActive,
  type CreateUserPayload,
} from "@/services/users.tsx"
import type { UserRole } from "@/shared/types/user"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

export const userQueryKeys = {
  all: ["users"] as const,
  list: (role?: UserRole) => ["users", "list", role ?? "all"] as const,
}

export function useUsersQuery(role?: UserRole) {
  return useQuery({
    queryKey: userQueryKeys.list(role),
    queryFn: () => listUsers(role ? { role } : undefined),
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
      toast.success(`${user.name} eklendi`)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Kullanıcı eklenemedi"))
    },
  })
}

export function useToggleUserActiveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => toggleUserActive(userId),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
      toast.success(
        user.is_active
          ? `${user.name} aktif edildi`
          : `${user.name} pasife alındı`,
      )
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Durum güncellenemedi"))
    },
  })
}
