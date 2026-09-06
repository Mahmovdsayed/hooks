# 05 · Abortable Search — `enableAbort: true`

Demonstrates request cancellation. When `enableAbort: true` the hook exposes an `abort()` function that cancels the current in-flight request via the native `AbortController`.

## What it shows

| Feature | Details |
|---|---|
| `enableAbort: true` | Enables `AbortController` for the request |
| `abort()` | Cancels the in-flight request |
| `onError` | Detects `"Request was cancelled"` message |
| `defaultValues` | Pre-filling form fields |

## Key code

```tsx
const { onSubmit, loading, abort } = useFormHandler({
  schema: searchSchema,
  endpoint: "/api/search",
  enableAbort: true,
  onError: (err) => {
    if (err?.message === "Request was cancelled") {
      console.log("Cancelled by user");
    }
  },
});

// In JSX:
{loading && abort && (
  <button type="button" onClick={abort}>Cancel</button>
)}
```
