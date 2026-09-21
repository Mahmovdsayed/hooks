"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UsePageSyncOptions {
  /** Query parameter name. @default "page" */
  paramName?: string;
  /** Fallback page when the param is missing or invalid. @default 1 */
  defaultPage?: number;
  /** Lower bound (inclusive). @default 1 */
  minPage?: number;
  /** Upper bound (inclusive). Useful when total pages are known. */
  maxPage?: number;
  /** Scroll to top when the page changes. @default true */
  scrollToTop?: boolean;
  /** Behavior passed to `window.scrollTo`. @default "smooth" */
  scrollBehavior?: ScrollBehavior;
  /** Use `router.replace` instead of `router.push`. @default false */
  replace?: boolean;
  /** Remove `?page=` from the URL when on the default page. @default true */
  omitDefaultInUrl?: boolean;
  /** Fired whenever the page actually changes. */
  onPageChange?: (page: number, previous: number) => void;
}

export interface UsePageSyncReturn {
  /** The currently active page (clamped). */
  currentPage: number;
  /** Set the page. Accepts a number or an updater fn (like `useState`). */
  setPage: (page: number | ((prev: number) => number)) => void;
  /** Go to the next page (no-op if already at `maxPage`). */
  nextPage: () => void;
  /** Go to the previous page (no-op if already at `minPage`). */
  prevPage: () => void;
  /** Reset to `defaultPage`. */
  resetPage: () => void;
  /** True when `currentPage === minPage`. */
  isFirstPage: boolean;
  /** True when `maxPage` is set and `currentPage === maxPage`. */
  isLastPage: boolean;
}

type SetPageInput = number | ((prev: number) => number);

export function usePageSync(
  options: UsePageSyncOptions = {},
): UsePageSyncReturn {
  const {
    paramName = "page",
    defaultPage = 1,
    minPage = 1,
    maxPage,
    scrollToTop = true,
    scrollBehavior = "smooth",
    replace = false,
    omitDefaultInUrl = true,
    onPageChange,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const clamp = useCallback(
    (value: number): number => {
      if (!Number.isFinite(value)) return defaultPage;
      let next = Math.max(minPage, Math.floor(value));
      if (typeof maxPage === "number") next = Math.min(maxPage, next);
      return next;
    },
    [defaultPage, minPage, maxPage],
  );

  const queryPage = useMemo(() => {
    const raw = searchParams.get(paramName);
    if (raw === null) return clamp(defaultPage);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? clamp(parsed) : clamp(defaultPage);
  }, [searchParams, paramName, defaultPage, clamp]);

  const [currentPage, setCurrentPageState] = useState<number>(queryPage);
  const prevPageRef = useRef<number>(queryPage);
  const onPageChangeRef = useRef(onPageChange);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    setCurrentPageState((prev) => (prev === queryPage ? prev : queryPage));
  }, [queryPage]);

  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      onPageChangeRef.current?.(currentPage, prevPageRef.current);
      prevPageRef.current = currentPage;
    }
  }, [currentPage]);

  useEffect(() => {
    if (currentPage === queryPage) return;

    const newParams = new URLSearchParams(searchParams.toString());

    if (omitDefaultInUrl && currentPage === defaultPage) {
      newParams.delete(paramName);
    } else {
      newParams.set(paramName, String(currentPage));
    }

    const qs = newParams.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;

    if (replace) {
      router.replace(url, { scroll: false });
    } else {
      router.push(url, { scroll: false });
    }

    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: scrollBehavior });
    }
  }, [
    currentPage,
    queryPage,
    searchParams,
    pathname,
    paramName,
    defaultPage,
    omitDefaultInUrl,
    replace,
    scrollToTop,
    scrollBehavior,
    router,
  ]);

  const setPage = useCallback(
    (page: SetPageInput) => {
      setCurrentPageState((prev) => {
        const next = typeof page === "function" ? page(prev) : page;
        return clamp(next);
      });
    },
    [clamp],
  );

  const nextPage = useCallback(() => {
    setCurrentPageState((prev) => clamp(prev + 1));
  }, [clamp]);

  const prevPage = useCallback(() => {
    setCurrentPageState((prev) => clamp(prev - 1));
  }, [clamp]);

  const resetPage = useCallback(() => {
    setCurrentPageState(clamp(defaultPage));
  }, [clamp, defaultPage]);

  const isFirstPage = currentPage <= minPage;
  const isLastPage = typeof maxPage === "number" && currentPage >= maxPage;

  return {
    currentPage,
    setPage,
    nextPage,
    prevPage,
    resetPage,
    isFirstPage,
    isLastPage,
  };
}
