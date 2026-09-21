# `usePageSync`

Synchronizes a page number with the URL query parameter `?page=`.

## What it shows

- URL ↔ state sync (`?page=N`)
- Browser back / forward support
- `maxPage` clamping
- `nextPage` / `prevPage` helpers
- `isFirstPage` / `isLastPage` derived flags

## Usage

```tsx
const { currentPage, nextPage, prevPage, isFirstPage, isLastPage } = usePageSync({ maxPage: 20 });
```

> **Note:** `usePageSync` uses `useSearchParams` internally. In the Next.js
> App Router it must be wrapped in a `<Suspense>` boundary.