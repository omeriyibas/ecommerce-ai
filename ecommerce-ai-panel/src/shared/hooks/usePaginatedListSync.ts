import { useEffect } from "react";
import type { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch.ts";
import { useClampPaginationPage } from "@/shared/hooks/useListPagination.ts";
import type { useListPagination } from "@/shared/hooks/useListPagination.ts";

type SearchState = ReturnType<typeof useDebouncedSearch>;
type PaginationState = ReturnType<typeof useListPagination>;

export type UsePaginatedListSyncParams = {
  search: SearchState;
  pagination: PaginationState;
  totalPages: number;
  /** Arama dışında sayfayı sıfırlayan ek tetikleyici (ör. filtre değeri). */
  resetAlsoOn?: unknown;
};

export function usePaginatedListSync({
  search,
  pagination,
  totalPages,
  resetAlsoOn,
}: UsePaginatedListSyncParams) {
  useEffect(() => {
    pagination.resetPage();
  }, [search.q, pagination.resetPage, resetAlsoOn]);

  useClampPaginationPage(pagination.page, pagination.setPage, totalPages);
}
