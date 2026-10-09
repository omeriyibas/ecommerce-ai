import { useEffect, useState } from "react";

const DEFAULT_DEBOUNCE_MS = 400;

export type UseDebouncedSearchOptions = {
  delayMs?: number;
  trim?: boolean;
};

export function useDebouncedSearch(options?: UseDebouncedSearchOptions) {
  const { delayMs = DEFAULT_DEBOUNCE_MS, trim = true } = options ?? {};
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      setQ(trim ? input.trim() : input);
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [input, delayMs, trim]);

  return { input, setInput, q, setQ };
}

/** Tek bir değeri debounce eder (dropdown arama gibi). */
export function useDebouncedValue<T>(value: T, delayMs = DEFAULT_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
