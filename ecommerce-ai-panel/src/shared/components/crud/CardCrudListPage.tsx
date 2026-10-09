import type { ReactNode } from "react";
import ConfirmationModal from "@/shared/components/modal/ConfirmationModal.tsx";
import DynamicSearchInput from "@/shared/components/common/DynamicSearchInput.tsx";
import CardListTable from "@/shared/components/table/CardListTable.tsx";
import DynamicPagination from "@/shared/components/table/DynamicPagination.tsx";
import type { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch.ts";
import type { useListPagination } from "@/shared/hooks/useListPagination.ts";
import type { BaseItem, ItemDetail } from "@/shared/types/ItemDetail";

type SearchState = ReturnType<typeof useDebouncedSearch>;
type PaginationState = ReturnType<typeof useListPagination>;

export interface CardCrudListHandlers<TItem> {
  confirmationModal: {
    isOpen: boolean;
    item: TItem | null;
  };
  handleConfirmationClose: () => void;
  handleConfirmationConfirm: () => void;
  handleDelete: (index: number, items: TItem[]) => void;
  handleEdit: (itemId: string | number, items: TItem[]) => void;
}

export interface CardCrudListQuery<TItem> {
  items: TItem[];
  total: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  isLoading: boolean;
  error: unknown;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export interface CardCrudListPageProps<TItem, TRow extends BaseItem> {
  header: ReactNode;
  modal?: ReactNode;
  handlers: CardCrudListHandlers<TItem>;
  deleteConfirmTitle?: string;
  deleteConfirmMessage: (item: TItem | null) => string;
  search: SearchState;
  /** Klasik sayfa numarası pagination (scrollPagination=false iken gerekli) */
  pagination?: PaginationState;
  /** true: IntersectionObserver scroll pagination */
  scrollPagination?: boolean;
  query: CardCrudListQuery<TItem>;
  tableItems: TRow[];
  columns: ItemDetail[];
  searchPlaceholder?: string;
  searchClassName?: string;
  searchInputClassName?: string;
  emptyMessage: string;
  emptySearchMessage?: string;
  modalHandle?: (name: string, itemId: string | number) => void;
  showSearch?: boolean;
}

export default function CardCrudListPage<TItem, TRow extends BaseItem>({
  header,
  modal,
  handlers,
  deleteConfirmTitle = "Silme onayı",
  deleteConfirmMessage,
  search,
  pagination,
  scrollPagination = false,
  query,
  tableItems,
  columns,
  searchPlaceholder = "Ara...",
  searchClassName = "relative max-w-sm",
  searchInputClassName = "h-[38px] pl-9",
  emptyMessage,
  emptySearchMessage,
  modalHandle,
  showSearch = true,
}: CardCrudListPageProps<TItem, TRow>) {
  const resolvedEmptyMessage =
    search.q && emptySearchMessage ? emptySearchMessage : emptyMessage;

  return (
    <>
      {modal}

      <ConfirmationModal
        isOpen={handlers.confirmationModal.isOpen}
        onClose={handlers.handleConfirmationClose}
        onConfirm={handlers.handleConfirmationConfirm}
        title={deleteConfirmTitle}
        message={deleteConfirmMessage(handlers.confirmationModal.item)}
        confirmText="Sil"
        cancelText="İptal"
      />

      <div className="space-y-6 p-4 md:p-6">
        {header}

        {showSearch ? (
          <DynamicSearchInput
            value={search.input}
            onChange={search.setInput}
            placeholder={searchPlaceholder}
            className={searchClassName}
            inputClassName={searchInputClassName}
          />
        ) : null}

        <CardListTable<TRow>
          items={tableItems}
          itemDetails={columns}
          modalHandle={modalHandle}
          removeHandle={(index) => handlers.handleDelete(index, query.items)}
          editHandle={(itemId) => handlers.handleEdit(itemId, query.items)}
          loading={query.isLoading}
          error={query.error ? "Liste yüklenirken hata oluştu" : null}
          emptyMessage={resolvedEmptyMessage}
          className="w-full"
          paginationEnabled={scrollPagination}
          hasNextPage={query.hasNextPage}
          isFetchingNextPage={Boolean(query.isFetchingNextPage)}
          fetchNextPage={query.fetchNextPage}
        />

        {!scrollPagination && pagination ? (
          <DynamicPagination
            total={query.total}
            page={pagination.page}
            totalPages={query.totalPages}
            hasPrevPage={query.hasPrevPage}
            hasNextPage={query.hasNextPage}
            perPage={pagination.perPage}
            onPerPageChange={pagination.onPerPageChange}
            isLoading={query.isLoading}
            onPrev={() => pagination.setPage((p) => Math.max(1, p - 1))}
            onNext={() => pagination.setPage((p) => p + 1)}
          />
        ) : null}
      </div>
    </>
  );
}
