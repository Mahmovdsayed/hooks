# 08 · Pre-configured Hook — `createFormHandler`

`createFormHandler` lets you bake shared config into a custom hook once and reuse it everywhere without repeating options. Think of it as a hook factory.

## What it shows

| Feature | Details |
|---|---|
| `createFormHandler(defaults)` | Returns a pre-configured `useFormHandler` hook |
| Shared `notify`, `resetOptions`, `axiosConfig` | Set once, applied everywhere |
| Per-call overrides | Each usage still accepts all options (deep-merged on top) |
| Checkbox array fields | `register("topics")` with multiple checkboxes |

## Key code

```tsx
// lib/hooks.ts — create once
export const useApiForm = createFormHandler({
  notify: (msg, type) => toast[type](msg),
  resetOptions: { resetAfterSuccess: true },
  axiosConfig: { withCredentials: true },
});

// any component — use like a normal hook
const { register, onSubmit, loading } = useApiForm({
  schema: mySchema,
  endpoint: "/api/whatever",
  // notify, resetOptions, axiosConfig already applied ✅
});
```

## Difference from `FormHandlerProvider`

| | `createFormHandler` | `FormHandlerProvider` |
|---|---|---|
| Mechanism | Hook factory (function) | React context |
| Scope | Per-hook-call | Subtree of components |
| Override | Deep merge at call site | Deep merge in hook |
| Best for | Shared axios/notify config | App-wide defaults |
