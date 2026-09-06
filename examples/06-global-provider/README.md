# 06 · Global Config — `createFormHandler` + `FormHandlerProvider`

Real-world pattern for sharing form config across an entire Next.js app.
Defines adapters, defaults, and HTTP settings **once** — all forms inherit them automatically.

---

## Files in this example

| File | Purpose |
|---|---|
| [`formConfig.ts`](./formConfig.ts) | **Single source of truth** — defines `useAppForm`, `notify`, `parseResponse`, `parseError` |
| [`FormProvider.tsx`](./FormProvider.tsx) | Context-based provider — place once in `layout.tsx` |
| [`layout.example.tsx`](./layout.example.tsx) | Shows where to mount `<FormProvider>` in Next.js App Router |
| [`SettingsPage.tsx`](./SettingsPage.tsx) | Three forms consuming the global config with no repeated setup |

---

## Two patterns — pick one

### Pattern A · `useAppForm` (recommended for most projects)

Define `useAppForm = createFormHandler({ ... })` in one file, import it everywhere.  
No React context needed — just a regular hook.

```ts
// lib/formConfig.ts
import { createFormHandler } from "@hirely/hooks";

export const useAppForm = createFormHandler({
  notify: (msg, type) => toast[type](msg),
  parseResponse: (res) => ({ success: res.ok, message: res.message }),
  parseError: (err) => ({ message: err?.response?.data?.message ?? err.message }),
  resetOptions: { resetAfterSuccess: true, keepDefaultValues: true },
  axiosConfig: { withCredentials: true },
  mode: "onTouched",
  reValidateMode: "onChange",
});
```

```tsx
// any component
import { useAppForm } from "@/lib/formConfig";

const { register, onSubmit, loading } = useAppForm({
  schema: profileSchema,
  endpoint: "/api/profile",
  method: "patch",
  // ↑ all global defaults already applied
});
```

---

### Pattern B · `FormHandlerProvider` (good for third-party / deeply nested components)

Wrap the app root once and use the standard `useFormHandler` anywhere inside.

```tsx
// app/layout.tsx
import { FormProvider } from "@/providers/FormProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FormProvider>{children}</FormProvider>
      </body>
    </html>
  );
}
```

```tsx
// any child component — no import of config needed
import { useFormHandler } from "@hirely/hooks";

const { register, onSubmit } = useFormHandler({
  schema: mySchema,
  endpoint: "/api/whatever",
  // notify, axiosConfig, mode, etc. all inherited from context ✅
});
```

---

## What lives in `formConfig.ts`

| Option | What it configures |
|---|---|
| `notify` | Toast adapter — swap body for sonner, react-hot-toast, etc. |
| `parseResponse` | Teaches the hook your API's success envelope shape |
| `parseError` | Teaches the hook how to extract messages from thrown errors |
| `resetOptions` | Global auto-reset behaviour after success |
| `axiosConfig` | `withCredentials`, shared headers, base URL, etc. |
| `mode` | Validation trigger (`"onTouched"` recommended) |
| `reValidateMode` | Re-validation trigger after first submit |

---

## Per-form overrides

Individual hooks **deep-merge** on top of global defaults — you can always override:

```tsx
useAppForm({
  schema: passwordSchema,
  endpoint: "/api/password",
  // Override just this one option:
  resetOptions: { resetAfterSuccess: false },
});
```

---

## Comparison

| | `useAppForm` | `FormHandlerProvider` |
|---|---|---|
| Setup | Import and call | Wrap in JSX |
| Scope | Any file that imports it | All descendants in the tree |
| Context required? | ❌ | ✅ |
| Best for | Most projects | Deep trees / 3rd-party components |
| Can be used together? | ✅ yes | ✅ yes |
