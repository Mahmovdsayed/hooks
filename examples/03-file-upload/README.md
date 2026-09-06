# 03 · File Upload — `useFormData: true`

Demonstrates uploading a file with Zod validation using the built-in `useFormData` flag — no manual `FormData` construction needed.

## What it shows

| Feature | Details |
|---|---|
| `useFormData: true` | Hook automatically wraps payload as `FormData` |
| `z.custom<File>()` | Validate a `File` input with Zod |
| `setValue` | Manually set the file field value |
| `watch` | Display the selected file name reactively |

## Key code

```tsx
useFormHandler({
  schema: avatarSchema,
  endpoint: "/api/profile/avatar",
  method: "post",
  useFormData: true, // ← magic flag
});

// In JSX:
<input
  type="file"
  onChange={(e) => setValue("avatar", e.target.files?.[0]!, { shouldValidate: true })}
/>
```
