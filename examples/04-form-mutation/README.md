# 04 · Contact Form — `useFormMutation`

Shows `useFormMutation` — the React Query–powered sibling of `useFormHandler`. Gives you `isPending`, `isError`, `data`, `status`, and the full `mutationOptions` API.

## What it shows

| Feature | Details |
|---|---|
| `useFormMutation` | Wraps `useMutation` + `useFormHandler` together |
| `isPending` / `isError` / `status` | React Query mutation state |
| `data` | Typed response from the last successful mutation |
| `mutationOptions` | Pass any React Query `UseMutationOptions` (e.g. `onMutate`, `onSettled`) |
| `reset` | Resets both the form AND the mutation state at once |

## When to use `useFormMutation` vs `useFormHandler`

| | `useFormHandler` | `useFormMutation` |
|---|---|---|
| Needs React Query? | ❌ | ✅ |
| Built-in `isPending` | via `loading` | ✅ native |
| `mutationOptions` | ❌ | ✅ |
| `data` from mutation | ❌ | ✅ |

## Key code

```tsx
const { register, onSubmit, isPending, data, status } = useFormMutation({
  schema: contactSchema,
  service: sendContact,
  mutationOptions: {
    onMutate: () => console.log("started"),
    onSettled: () => console.log("done"),
  },
});
```
