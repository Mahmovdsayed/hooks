# @hirely/hooks

<div align="center">

[![npm version](https://img.shields.io/npm/v/@hirely/hooks.svg?style=flat-square&color=6366f1)](https://www.npmjs.com/package/@hirely/hooks)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@hirely/hooks?style=flat-square&color=22c55e&label=minzipped)](https://bundlephobia.com/package/@hirely/hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18_%7C_19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Bun](https://img.shields.io/badge/Built_with-Bun-fbf0df?style=flat-square&logo=bun&logoColor=black)](https://bun.sh)

<br/>

**The last form hook you'll ever need.**

Production-ready, fully type-safe React form management with Zod validation,  
optional Axios / Sonner / TanStack Query integration — zero forced dependencies.

<br/>

</div>

---

## Why `@hirely/hooks`?

Writing forms in React usually means wiring up `react-hook-form` + `zod` + your HTTP client + a toast library + loading/error state — every single time. `@hirely/hooks` does all of that in one hook call:

```tsx
// Before
const schema = z.object({ email: z.string().email() });
const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) });
const [loading, setLoading] = useState(false);
const onSubmit = handleSubmit(async (data) => {
  setLoading(true);
  try {
    await axios.post("/api/login", data);
    toast.success("Logged in!");
  } catch (e) {
    toast.error(e.message);
  } finally {
    setLoading(false);
  }
});

// After — with @hirely/hooks
const { register, onSubmit, loading } = useFormHandler({
  schema,
  endpoint: "/api/login",
});
```

---

## Features

| | Feature | Detail |
|---|---|---|
| 🛡️ | **End-to-end type safety** | Define your Zod schema once — get inferred form types, auto-complete, and compile-time checks |
| ⚡ | **Stable references** | `onSubmit` and handlers are referentially stable across re-renders — no wasted renders |
| 🔌 | **Bring your own client** | Works with `axios`, `fetch`, Next.js Server Actions, or any async function |
| 🔔 | **Smart notifications** | Auto-detects Sonner if installed; falls back gracefully or accepts a custom `notify` fn |
| 🔄 | **TanStack Query v5** | `useFormMutation` merges form state + mutation cache + retry logic into one hook |
| 🌐 | **Global defaults** | `createFormHandler` factory and `FormHandlerProvider` context for app-wide config |
| 📦 | **Dual ESM + CJS** | Native ESM (`.mjs`), CommonJS (`.cjs`), and full TypeScript declarations (`.d.ts`) |
| 🚀 | **Next.js App Router** | `"use client"` directive included — works in RSC architectures out of the box |

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core API — `useFormHandler`](#core-api--useformhandler)
  - [Options](#options)
  - [Return Value](#return-value)
- [Recipes](#recipes)
  - [Next.js Server Actions](#nextjs-server-actions)
  - [Native `fetch`](#native-fetch)
  - [File Uploads](#file-uploads)
  - [Request Cancellation](#request-cancellation)
  - [Optimistic Updates](#optimistic-updates)
  - [Custom Response & Error Parsers](#custom-response--error-parsers)
- [TanStack Query — `useFormMutation`](#tanstack-query--useformmutation)
- [Global Configuration](#global-configuration)
  - [Factory — `createFormHandler`](#factory--createformhandler)
  - [Context — `FormHandlerProvider`](#context--formhandlerprovider)
- [Higher-Order Component — `withFormHandler`](#higher-order-component--withformhandler)
- [License](#license)

---

## Installation

```bash
# Bun (recommended)
bun add @hirely/hooks

# npm
npm install @hirely/hooks

# pnpm
pnpm add @hirely/hooks

# Yarn
yarn add @hirely/hooks
```

### Required peer dependencies

```bash
bun add react react-hook-form zod
```

### Optional peer dependencies

Install only what you use:

| Package | When you need it |
|---|---|
| `axios` | When using `endpoint` without a custom `service` |
| `sonner` | For automatic toast notifications without a custom `notify` |
| `@tanstack/react-query` | When using `useFormMutation` |

```bash
bun add axios sonner @tanstack/react-query
```

> **Tip:** If you provide your own `service` and `notify`, you need none of the above.

---

## Quick Start

```tsx
"use client";

import { useFormHandler } from "@hirely/hooks";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function LoginForm() {
  const { register, onSubmit, loading, error, formState } = useFormHandler({
    schema: loginSchema,
    endpoint: "/api/auth/login",
    onSuccess: () => {
      // redirect, update cache, etc.
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <div>
        <input {...register("email")} type="email" placeholder="Email" />
        {formState.errors.email && (
          <p>{formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <input {...register("password")} type="password" placeholder="Password" />
        {formState.errors.password && (
          <p>{formState.errors.password.message}</p>
        )}
      </div>

      {error && <p className="form-error">{error.message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

---

## Core API — `useFormHandler`

```ts
const form = useFormHandler(options);
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `schema` | `ZodType<FieldValues>` | **required** | Zod schema for validation and type inference |
| `endpoint` | `string` | `undefined` | API URL — uses Axios if no `service` is provided |
| `method` | `'post' \| 'patch' \| 'put' \| 'delete'` | `'post'` | HTTP method for `endpoint` |
| `service` | `(data: TData) => Promise<any>` | `undefined` | Custom async function — overrides `endpoint` |
| `defaultValues` | `DefaultValues<TData>` | `undefined` | Initial field values |
| `values` | `TData` | `undefined` | Reactive external values synced into the form |
| `transformData` | `(data: TData) => any` | `undefined` | Transform payload before submission |
| `onMutate` | `(data: TData) => any \| Promise<any>` | `undefined` | Pre-submission hook; return value becomes `context` |
| `onSuccess` | `(data: any, context?: any) => void` | `undefined` | Called after a successful submission |
| `onError` | `(error: any, context?: any) => void` | `undefined` | Called on submission failure |
| `onSubmitStart` | `() => void` | `undefined` | Called when submission begins |
| `onSubmitEnd` | `() => void` | `undefined` | Called when submission ends (success or error) |
| `notify` | `(message: string, type: 'success' \| 'error') => void` | auto Sonner | Custom notification function |
| `resetOptions` | `{ resetAfterSuccess?, keepDefaultValues?, keepDirty? }` | `{ resetAfterSuccess: true, keepDefaultValues: true }` | Controls form reset on success |
| `useFormData` | `boolean` | `false` | Serialize payload as `FormData` (supports `File`, `Blob`) |
| `enableAbort` | `boolean` | `false` | Enables `abort()` to cancel in-flight requests |
| `axiosConfig` | `Record<string, any>` | `{}` | Extra config forwarded to Axios |
| `mode` | `'onSubmit' \| 'onBlur' \| 'onChange' \| 'onTouched' \| 'all'` | `'onSubmit'` | Validation trigger mode |
| `reValidateMode` | `'onChange' \| 'onBlur' \| 'onSubmit'` | `'onChange'` | Re-validation mode after first submit |
| `parseResponse` | `(res: any) => { success: boolean, message?: string }` | built-in | Custom response shape parser |
| `parseError` | `(err: any) => { message: string }` | built-in | Custom error message extractor |

### Return Value

Returns **all of React Hook Form's `useForm` return** — `register`, `watch`, `setValue`, `getValues`, `control`, `formState`, `reset`, etc. — plus:

| Property | Type | Description |
|---|---|---|
| `onSubmit` | `(e?: unknown) => Promise<void>` | Submit handler — attach directly to `<form onSubmit={onSubmit}>` |
| `loading` | `boolean` | `true` while the request is in-flight |
| `error` | `Error \| null` | Submission error, if any |
| `setError` | `React.Dispatch` | Manually set or clear the error state |
| `abort` | `(() => void) \| undefined` | Cancel the current request (only when `enableAbort: true`) |

---

## Recipes

### Next.js Server Actions

`service` accepts any async function — plug in Server Actions directly:

```ts
// app/actions/auth.ts
"use server";
import { z } from "zod";

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function signUpAction(data: z.infer<typeof signUpSchema>) {
  // call your database / external API
  return { success: true, message: "Account created!", userId: "u_123" };
}
```

```tsx
// app/components/SignUpForm.tsx
"use client";
import { useFormHandler } from "@hirely/hooks";
import { signUpAction } from "@/app/actions/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export function SignUpForm() {
  const { register, onSubmit, loading } = useFormHandler({
    schema,
    service: signUpAction,
    onSuccess: (data) => console.log("User ID:", data.userId),
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register("name")} placeholder="Name" />
      <input {...register("email")} placeholder="Email" />
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}
```

---

### Native `fetch`

```tsx
const { register, onSubmit, loading } = useFormHandler({
  schema: itemSchema,
  service: async (data) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  },
});
```

---

### File Uploads

Set `useFormData: true` to automatically serialize `File`, `Blob`, and arrays of files into `FormData`:

```tsx
const uploadSchema = z.object({
  title: z.string().min(1),
  avatar: z.instanceof(File),
});

const { register, onSubmit, setValue } = useFormHandler({
  schema: uploadSchema,
  endpoint: "/api/upload",
  useFormData: true, // automatically sets Content-Type: multipart/form-data
});

// Wire up a file input:
<input
  type="file"
  onChange={(e) => setValue("avatar", e.target.files?.[0])}
/>
```

---

### Request Cancellation

```tsx
const { onSubmit, abort, loading } = useFormHandler({
  schema: reportSchema,
  endpoint: "/api/generate-report",
  enableAbort: true,
});

return (
  <form onSubmit={onSubmit}>
    <button type="submit" disabled={loading}>Generate</button>
    {loading && (
      <button type="button" onClick={abort}>✕ Cancel</button>
    )}
  </form>
);
```

---

### Optimistic Updates

Use `onMutate` for client-side updates before the request resolves, and roll back on error:

```tsx
const { onSubmit } = useFormHandler({
  schema: taskSchema,
  endpoint: "/api/tasks/42",
  method: "patch",
  onMutate: async (newData) => {
    const previous = currentTask; // snapshot
    setTask((prev) => ({ ...prev, ...newData })); // optimistic update
    return { previous }; // returned as `context`
  },
  onError: (_error, context) => {
    setTask(context.previous); // rollback
  },
});
```

---

### Custom Response & Error Parsers

Adapt to any API response shape:

```tsx
useFormHandler({
  schema: mySchema,
  endpoint: "/api/data",
  parseResponse: (res) => ({
    success: res.statusCode === 200,
    message: res.statusText,
    data: res.payload,
  }),
  parseError: (err) => ({
    message:
      err.response?.data?.errorDescription ??
      err.message ??
      "Something went wrong",
  }),
});
```

---

## TanStack Query — `useFormMutation`

Combines form state with React Query's cache management, retry logic, and mutation lifecycle:

```tsx
"use client";

import { useFormMutation } from "@hirely/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content too short"),
});

export function CreatePost() {
  const queryClient = useQueryClient();

  const {
    register,
    onSubmit,
    isPending,
    isError,
    error,
    formError,
    data,
    reset,       // resets both the form AND the mutation
    resetForm,   // resets only the form
    resetMutation,
    status,
  } = useFormMutation({
    schema: postSchema,
    endpoint: "/api/posts",
    mutationOptions: {
      retry: 2,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      },
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register("title")} placeholder="Title" />
      <textarea {...register("content")} placeholder="Content" />

      {formError && <p>Form error: {formError.message}</p>}
      {isError && <p>Mutation error: {error?.message}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Publishing..." : "Publish"}
      </button>
      <button type="button" onClick={reset}>Reset</button>
    </form>
  );
}
```

### `useFormMutation` extra return properties

| Property | Type | Description |
|---|---|---|
| `mutate` | `UseMutateFunction` | Fire the mutation imperatively |
| `mutateAsync` | `UseMutateAsyncFunction` | Fire the mutation and `await` the result |
| `isPending` | `boolean` | TanStack Query v5 pending state |
| `isLoading` | `boolean` | Alias for `isPending` (backwards compatible) |
| `isError` | `boolean` | Whether the mutation errored |
| `error` | `TError \| null` | Mutation-level error |
| `formError` | `Error \| null` | Form-level error (from `useFormHandler`) |
| `data` | `TResponse \| undefined` | Mutation response data |
| `reset` | `() => void` | Resets **both** form and mutation state |
| `resetForm` | `UseFormReturn["reset"]` | Resets only the form |
| `resetMutation` | `() => void` | Resets only the mutation |
| `status` | `'idle' \| 'pending' \| 'success' \| 'error'` | Current mutation status |

---

## Global Configuration

### Factory — `createFormHandler`

Create a pre-configured hook with your app's defaults:

```ts
// lib/form.ts
import { createFormHandler } from "@hirely/hooks";
import { toast } from "your-toast-library";

export const useAppForm = createFormHandler({
  mode: "onBlur",
  axiosConfig: {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
  },
  resetOptions: { resetAfterSuccess: true, keepDefaultValues: false },
  notify: (msg, type) => {
    type === "success" ? toast.success(msg) : toast.error(msg);
  },
});
```

```tsx
// Any component
import { useAppForm } from "@/lib/form";

const { register, onSubmit } = useAppForm({
  schema: mySchema,
  endpoint: "/api/resource", // inherits baseURL, withCredentials, etc.
});
```

---

### Context — `FormHandlerProvider`

Scope defaults to a sub-tree of your component hierarchy:

```tsx
import { FormHandlerProvider } from "@hirely/hooks";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <FormHandlerProvider
      defaultOptions={{
        axiosConfig: { headers: { "X-Admin-Token": "true" } },
        resetOptions: { resetAfterSuccess: false },
      }}
    >
      {children}
    </FormHandlerProvider>
  );
}
```

Every `useFormHandler` inside this tree inherits and deep-merges the provider's defaults with any local overrides.

---

## Higher-Order Component — `withFormHandler`

For class components or HOC-based architectures:

```tsx
import React from "react";
import { withFormHandler } from "@hirely/hooks";
import type { useFormHandler } from "@hirely/hooks";
import { z } from "zod";

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  notes: z.string().optional(),
});

type Props = {
  formHandler: ReturnType<typeof useFormHandler<typeof feedbackSchema>>;
  category: string;
};

class FeedbackForm extends React.Component<Props> {
  render() {
    const { formHandler, category } = this.props;
    return (
      <form onSubmit={formHandler.onSubmit}>
        <h3>Category: {category}</h3>
        <input
          type="number"
          {...formHandler.register("rating", { valueAsNumber: true })}
        />
        <button type="submit" disabled={formHandler.loading}>
          Submit
        </button>
      </form>
    );
  }
}

export default withFormHandler(FeedbackForm, {
  schema: feedbackSchema,
  endpoint: "/api/feedback",
});
```

---

## License

[MIT](LICENSE) © [Hirely](https://github.com/Mahmovdsayed)