import { useQuery, type QueryKey } from "@tanstack/react-query";

export interface PaginatedApiResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_prev_page: boolean;
  has_next_page: boolean;
}

export interface PaginatedListQueryResult<TItem> {
  items: TItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  isLoading: boolean;
  error: unknown;
}

export interface UsePaginatedListQueryOptions<TItem> {
  queryKey: QueryKey;
  queryFn: () => Promise<PaginatedApiResponse<TItem>>;
  page: number;
  perPage: number;
  enabled?: boolean;
}

export function usePaginatedListQuery<TItem>({
  queryKey,
  queryFn,
  page,
  perPage,
  enabled = true,
}: UsePaginatedListQueryOptions<TItem>): PaginatedListQueryResult<TItem> {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    enabled,
  });

  return {
    items: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    perPage: data?.per_page ?? perPage,
    totalPages: data?.total_pages ?? 1,
    hasPrevPage: data?.has_prev_page ?? false,
    hasNextPage: data?.has_next_page ?? false,
    isLoading,
    error,
  };
}
