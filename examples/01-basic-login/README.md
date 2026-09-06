# 01 · Basic Login Form — `useFormHandler`

The simplest use-case: a login form that POSTs to an endpoint.

## What it shows

| Feature | Details |
|---|---|
| `useFormHandler` | Core hook wiring form + HTTP |
| `schema` | Zod validation (email + min-length password) |
| `endpoint` | Native `fetch` POST to `/api/auth/login` |
| `notify` | Pluggable toast callback |
| `onSuccess` / `onError` | Side-effect callbacks |
| `loading` | Built-in loading state |
| `error` | Built-in form-level error state |

## Usage

```tsx
import LoginForm from "./LoginForm";

export default function Page() {
  return <LoginForm />;
}
```

## Key code

```tsx
const { register, onSubmit, loading, error, formState: { errors } } = useFormHandler({
  schema: loginSchema,
  endpoint: "/api/auth/login",
  method: "post",
  notify: (msg, type) => toast[type](msg),
  onSuccess: (data) => router.push("/dashboard"),
});
```
