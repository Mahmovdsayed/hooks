# 02 · Register Form — Custom `service` + Cross-field Validation

Shows how to use a **custom async `service` function** instead of an endpoint, and how to add cross-field Zod validation (password confirmation).

## What it shows

| Feature | Details |
|---|---|
| `service` | Custom async function instead of `endpoint` |
| Cross-field validation | `.refine()` on the Zod schema |
| `resetOptions` | Auto-reset form after success |
| `loading` / `error` | Built-in state |

## Key code

```tsx
const registerSchema = z.object({ ... }).refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] }
);

useFormHandler({
  schema: registerSchema,
  service: async (data) => {
    const res = await fetch("/api/register", { method: "POST", body: JSON.stringify(data) });
    return res.json();
  },
  resetOptions: { resetAfterSuccess: true },
});
```
