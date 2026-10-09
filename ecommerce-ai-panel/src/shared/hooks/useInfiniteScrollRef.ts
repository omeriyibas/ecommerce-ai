import { useCallback, useEffect, useRef, type RefObject } from 'react'

export type UseInfiniteScrollRefOptions = {
  enabled?: boolean
  hasNextPage: boolean
  isFetchingNextPage?: boolean
  isLoading?: boolean
  fetchNextPage?: () => void
  /** Nested scroll container (örn. overflow-y-auto liste). Yoksa viewport. */
  rootRef?: RefObject<Element | null>
  rootMargin?: string
}

/**
 * IntersectionObserver tabanlı scroll pagination ref callback.
 * Son elemana / sentinel'e verilir; görünür olunca fetchNextPage çağrılır.
 */
export function useInfiniteScrollRef<T extends Element = HTMLElement>(
  options: UseInfiniteScrollRefOptions,
) {
  const {
    enabled = true,
    hasNextPage,
    isFetchingNextPage = false,
    isLoading = false,
    fetchNextPage,
    rootRef,
    rootMargin = '0px 0px 120px 0px',
  } = options

  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadMoreRef = useCallback(
    (node: T | null) => {
      if (isLoading || !enabled || !hasNextPage || isFetchingNextPage) {
        return
      }
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasNextPage && fetchNextPage) {
            fetchNextPage()
          }
        },
        {
          root: rootRef?.current ?? null,
          rootMargin,
        },
      )

      if (node) {
        observerRef.current.observe(node)
      }
    },
    [
      enabled,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
      fetchNextPage,
      rootRef,
      rootMargin,
    ],
  )

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  return loadMoreRef
}
