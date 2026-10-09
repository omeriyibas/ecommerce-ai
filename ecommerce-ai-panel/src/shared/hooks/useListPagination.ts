import { useCallback, useEffect, useState } from "react";

export type UseListPaginationOptions = {
  initialPage?: number;
  initialPerPage?: number;
};

export function useListPagination(options?: UseListPaginationOptions) {
  const { initialPage = 1, initialPerPage = 20 } = options ?? {};
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);

  const resetPage = useCallback(() => setPage(1), []);

  const onPerPageChange = useCallback((value: number) => {
    setPerPage(value);
    setPage(1);
  }, []);

  return {
    page,
    setPage,
    perPage,
    setPerPage,
    resetPage,
    onPerPageChange,
  };
}

export function useClampPaginationPage(
  page: number,
  setPage: (page: number) => void,
  totalPages: number,
) {
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(Math.max(1, totalPages));
    }
  }, [page, totalPages, setPage]);
}
