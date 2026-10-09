import { useCallback, useState } from "react";
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { CardCrudListHandlers } from "@/shared/components/crud/CardCrudListPage.tsx";

function getErrorDetail(error: unknown): string | undefined {
  const anyErr = error as {
    response?: { data?: { detail?: string; message?: string } };
  };
  const detail = anyErr?.response?.data?.detail;
  const message = anyErr?.response?.data?.message;
  return typeof detail === "string"
    ? detail
    : typeof message === "string"
      ? message
      : undefined;
}

function invalidateQueryKeys(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKeys: QueryKey[],
) {
  for (const queryKey of queryKeys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

export interface UseCrudListHandlersOptions {
  queryKeys: QueryKey[];
  deleteFn: (id: number) => Promise<unknown>;
  messages?: {
    deleteSuccess?: string;
    deleteError?: string;
  };
  onDeleteError?: (error: unknown) => boolean | void;
}

export type CrudListHandlers<TItem extends { id: number }> =
  CardCrudListHandlers<TItem> & {
    modalIsOpen: boolean;
    editing: TItem | null;
    refresh: () => void;
    handleModalClose: () => void;
    setModalIsOpen: (open: boolean) => void;
    openNew: () => void;
    openEdit: (item: TItem) => void;
  };

export function useCrudListHandlers<TItem extends { id: number }>({
  queryKeys,
  deleteFn,
  messages,
  onDeleteError,
}: UseCrudListHandlersOptions): CrudListHandlers<TItem> {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editing, setEditing] = useState<TItem | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    item: TItem | null;
  }>({ isOpen: false, item: null });
  const queryClient = useQueryClient();

  const refresh = useCallback(() => {
    invalidateQueryKeys(queryClient, queryKeys);
  }, [queryClient, queryKeys]);

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      invalidateQueryKeys(queryClient, queryKeys);
      if (messages?.deleteSuccess) {
        toast.success(messages.deleteSuccess);
      }
      setConfirmationModal({ isOpen: false, item: null });
    },
    onError: (error: unknown) => {
      if (onDeleteError?.(error)) {
        return;
      }
      const detail = getErrorDetail(error);
      toast.error(
        detail ?? messages?.deleteError ?? "Silme sırasında hata oluştu",
      );
    },
  });

  const handleDelete = useCallback(
    (index: number, items: TItem[]) => {
      const row = items[index];
      if (row) setConfirmationModal({ isOpen: true, item: row });
    },
    [],
  );

  const handleEdit = useCallback(
    (itemId: string | number, items: TItem[]) => {
      const row = items.find((x) => x.id === Number(itemId));
      if (row) {
        setEditing(row);
        setModalIsOpen(true);
      }
    },
    [],
  );

  const handleModalClose = useCallback(() => {
    setModalIsOpen(false);
    setEditing(null);
  }, []);

  const handleConfirmationClose = useCallback(() => {
    setConfirmationModal({ isOpen: false, item: null });
  }, []);

  const handleConfirmationConfirm = useCallback(() => {
    if (confirmationModal.item) {
      deleteMutation.mutate(confirmationModal.item.id);
    }
  }, [confirmationModal.item, deleteMutation]);

  const openNew = useCallback(() => {
    setEditing(null);
    setModalIsOpen(true);
  }, []);

  const openEdit = useCallback((item: TItem) => {
    setEditing(item);
    setModalIsOpen(true);
  }, []);

  return {
    modalIsOpen,
    editing,
    confirmationModal,
    refresh,
    handleDelete,
    handleEdit,
    openEdit,
    handleModalClose,
    handleConfirmationClose,
    handleConfirmationConfirm,
    setModalIsOpen,
    openNew,
  };
}
