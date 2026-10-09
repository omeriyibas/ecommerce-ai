import { useCallback } from "react";
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";

function getErrorDetail(error: unknown): string | undefined {
  const anyErr = error as {
    response?: { data?: { detail?: string } };
  };
  const detail = anyErr?.response?.data?.detail;
  return typeof detail === "string" ? detail : undefined;
}

function invalidateQueryKeys(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKeys: QueryKey[],
) {
  for (const queryKey of queryKeys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

export interface UseActiveToggleMutationOptions {
  queryKeys: QueryKey[];
  extraInvalidateKeys?: QueryKey[];
  updateFn: (id: number, is_active: boolean) => Promise<unknown>;
  messages?: {
    success?: string;
    error?: string;
  };
}

export function useActiveToggleMutation({
  queryKeys,
  extraInvalidateKeys = [],
  updateFn,
  messages,
}: UseActiveToggleMutationOptions) {
  const queryClient = useQueryClient();

  const updateActiveMutation = useMutation({
    mutationFn: ({
      id,
      is_active,
    }: {
      id: number;
      is_active: boolean;
    }) => updateFn(id, is_active),
    onSuccess: () => {
      invalidateQueryKeys(queryClient, [...queryKeys, ...extraInvalidateKeys]);
      if (messages?.success) {
        toast.success(messages.success);
      }
    },
    onError: (error: unknown) => {
      const detail = getErrorDetail(error);
      toast.error(detail ?? messages?.error ?? "Güncelleme başarısız");
    },
  });

  const handleActiveToggle = useCallback(
    (itemId: string | number, checked: boolean) => {
      updateActiveMutation.mutate({
        id: Number(itemId),
        is_active: checked,
      });
    },
    [updateActiveMutation],
  );

  return { handleActiveToggle };
}
