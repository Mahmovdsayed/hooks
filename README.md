# @hirely/hooks

<div align="center">

[![npm version](https://img.shields.io/npm/v/@hirely/hooks.svg?style=flat-square&color=6366f1)](https://www.npmjs.com/package/@hirely/hooks)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@hirely/hooks?style=flat-square&color=22c55e&label=minzipped)](https://bundlephobia.com/package/@hirely/hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18_%7C_19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000?style=flat-square&logo=next.js)](https://nextjs.org/)

<br/>

**The last form hook you'll ever need.**

Type-safe React form management with Zod validation, built-in `fetch`, optional axios,  
optional toast — bring your own HTTP client, bring your own notifications.

<br/>

</div>

---

## Why `@hirely/hooks`?

```tsx
// ❌ Before — wiring everything manually, every time
const schema = z.object({ email: z.string().email() });
const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) });
const [loading, setLoading] = useState(false);
const onSubmit = handleSubmit(async (data) => {
  setLoading(true);
  try {
    await fetch("/api/login", { method: "POST", body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" } });
    toast.success("Logged in!");
  } catch (e) {
    toast.error(e.message);
  } finally { setLoading(false); }
});

// ✅ After — one hook call
const { register, onSubmit, loading } = useFormHandler({
  schema,
  endpoint: "/api/login",                        // uses fetch automatically
  notify: (msg, type) => toast[type](msg),        // your own toast
});
```

---

## Features

| | Feature | Detail |
|---|---|---|
| 🛡️ | **End-to-end type safety** | Zod schema → inferred form types, auto-complete, compile-time checks |
| 🌐 | **Built-in `fetch`** | Works out of the box with `endpoint` — no HTTP client setup needed |
| 🔌 | **Bring your own client** | Pass `axiosInstance`, `service`, or any async function |
| 🔔 | **Bring your own toast** | Pass `notify` with your toast library — no sonner auto-import |
| ⚡ | **Zero bundler issues** | No dynamic imports, no `require()`, no `node:module` — Turbopack-safe |
| 🔄 | **TanStack Query v5** | `useFormMutation` merges form state + React Query mutations |
| 🌍 | **Global defaults** | `createFormHandler` factory and `FormHandlerProvider` context |
| 📦 | **Dual ESM + CJS** | ESM `.mjs`, CJS `.cjs`, TypeScript `.d.ts`, `"use client"` ready |

---

## Installation

```bash
bun add @hirely/hooks        # Bun
npm install @hirely/hooks    # npm
pnpm add @hirely/hooks       # pnpm
yarn add @hirely/hooks       # Yarn
```

### Required peer dependencies

```bash
bun add react react-hook-form zod
```

### Optional peer dependencies

| Package | When you need it |
|---|---|
| `@tanstack/react-query` | When using `useFormMutation` |

> **No axios or sonner required.** The library uses native `fetch` by default and accepts any toast function via `notify`.

---

## Table of Contents

- [Quick Start](#quick-start)
- [HTTP Clients](#http-clients)
  - [Native `fetch` (default)](#native-fetch-default)
  - [Axios](#axios)
  - [Custom `service`](#custom-service)
  - [Next.js Server Actions](#nextjs-server-actions)
- [Notifications](#notifications)
- [Core API — `useFormHandler`](#core-api--useformhandler)
  - [Options](#options)
  - [Return Value](#return-value)
- [Recipes](#recipes)
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

## Quick Start

```tsx
"use client";

import { useFormHandler } from "@hirely/hooks";
import { toast } from "sonner"; // or any toast library
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function LoginForm() {
  const { register, onSubmit, loading, error, formState } = useFormHandler({
    schema: loginSchema,
    endpoint: "/api/auth/login",              // ← uses fetch automatically
    notify: (msg, type) => toast[type](msg),  // ← your own toast
    onSuccess: () => router.push("/dashboard"),
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register("email")} type="email" placeholder="Email" />
      {formState.errors.email && <p>{formState.errors.email.message}</p>}

      <input {...register("password")} type="password" placeholder="Password" />
      {formState.errors.password && <p>{formState.errors.password.message}</p>}

      {error && <p>{error.message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

---

## HTTP Clients

### Native `fetch` (default)

When you provide `endpoint`, the hook uses the browser's built-in `fetch` — no configuration needed:

```tsx
useFormHandler({
  schema,
  endpoint: "/api/users",        // POST by default
  method: "patch",               // optional: post | patch | put | delete
});
```

Pass extra headers or credentials via `axiosConfig`:

```tsx
useFormHandler({
  schema,
  endpoint: "/api/users",
  axiosConfig: {
    headers: { "X-Custom-Header": "value" },
    withCredentials: true,  // sends cookies with the request
  },
});
```

### Axios

Pass your own configured axios instance to use it instead of fetch:

```tsx
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

useFormHandler({
  schema,
  endpoint: "/users",       // resolves against axios baseURL
  axiosInstance: api,       // ← use your axios instance
});
```

### Custom `service`

Pass any async function — axios, custom fetch wrapper, SDK, etc:

```tsx
useFormHandler({
  schema,
  service: async (data) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  },
});
```

### Next.js Server Actions

```ts
// app/actions/auth.ts
"use server";
import { z } from "zod";

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function signUpAction(data: z.infer<typeof signUpSchema>) {
  // database / external API call
  return { success: true, message: "Account created!", userId: "u_123" };
}
```

```tsx
// components/SignUpForm.tsx
"use client";
import { useFormHandler } from "@hirely/hooks";
import { signUpAction } from "@/app/actions/auth";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({ name: z.string().min(2), email: z.string().email() });

export function SignUpForm() {
  const { register, onSubmit, loading } = useFormHandler({
    schema,
    service: signUpAction,
    notify: (msg, type) => toast[type](msg),
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

## Notifications

The library never imports a toast library. Pass your own `notify` function:

```tsx
// Sonner
import { toast } from "sonner";
notify: (msg, type) => toast[type](msg)

// React Hot Toast
import toast from "react-hot-toast";
notify: (msg, type) => type === "success" ? toast.success(msg) : toast.error(msg)

// Shadcn/ui toast
import { toast } from "@/components/ui/use-toast";
notify: (msg, type) => toast({ title: msg, variant: type === "error" ? "destructive" : "default" })

// Any custom function
notify: (msg, type) => console.log(`[${type}] ${msg}`)
```

If `notify` is not provided, notifications are silently skipped.

---

## Core API — `useFormHandler`

```ts
const form = useFormHandler(options);
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `schema` | `ZodType<FieldValues>` | **required** | Zod schema for validation and type inference |
| `endpoint` | `string` | `undefined` | API URL — uses native `fetch` unless `axiosInstance` is also provided |
| `method` | `'post' \| 'patch' \| 'put' \| 'delete'` | `'post'` | HTTP method |
| `service` | `(data: TData) => Promise<any>` | `undefined` | Custom async function — overrides `endpoint` |
| `axiosInstance` | `AxiosInstance` | `undefined` | Your axios instance — used with `endpoint` instead of fetch |
| `defaultValues` | `DefaultValues<TData>` | `undefined` | Initial field values |
| `values` | `TData` | `undefined` | Reactive external values synced into the form |
| `transformData` | `(data: TData) => any` | `undefined` | Transform payload before submission |
| `onMutate` | `(data: TData) => any \| Promise<any>` | `undefined` | Pre-submission hook; return value becomes `context` |
| `onSuccess` | `(data: any, context?: any) => void` | `undefined` | Called after a successful submission |
| `onError` | `(error: any, context?: any) => void` | `undefined` | Called on submission failure |
| `onSubmitStart` | `() => void` | `undefined` | Called when submission begins |
| `onSubmitEnd` | `() => void` | `undefined` | Called when submission ends (success or error) |
| `notify` | `(message: string, type: 'success' \| 'error') => void` | silent | Your toast/notification function |
| `resetOptions` | `{ resetAfterSuccess?, keepDefaultValues?, keepDirty? }` | `{ resetAfterSuccess: true, keepDefaultValues: true }` | Controls form reset on success |
| `useFormData` | `boolean` | `false` | Serialize payload as `FormData` (supports `File`, `Blob`) |
| `enableAbort` | `boolean` | `false` | Enables `abort()` to cancel in-flight requests |
| `axiosConfig` | `{ headers?, withCredentials?, ... }` | `{}` | Extra options merged into fetch or axios requests |
| `mode` | `'onSubmit' \| 'onBlur' \| 'onChange' \| 'onTouched' \| 'all'` | `'onSubmit'` | Validation trigger mode |
| `reValidateMode` | `'onChange' \| 'onBlur' \| 'onSubmit'` | `'onChange'` | Re-validation mode after first submit |
| `parseResponse` | `(res: any) => { success: boolean, message?: string }` | built-in | Custom response shape parser |
| `parseError` | `(err: any) => { message: string }` | built-in | Custom error message extractor |

### Return Value

Returns all of React Hook Form's `useForm` (`register`, `watch`, `setValue`, `getValues`, `control`, `formState`, `reset`, etc.) plus:

| Property | Type | Description |
|---|---|---|
| `onSubmit` | `(e?: unknown) => Promise<void>` | Attach directly to `<form onSubmit={onSubmit}>` |
| `loading` | `boolean` | `true` while the request is in-flight |
| `error` | `Error \| null` | Submission error, if any |
| `setError` | `React.Dispatch` | Manually set or clear the error state |
| `abort` | `(() => void) \| undefined` | Cancel the current request (only when `enableAbort: true`) |

---

## Recipes

### File Uploads

```tsx
const uploadSchema = z.object({
  title: z.string().min(1),
  avatar: z.instanceof(File),
});

const { register, onSubmit, setValue } = useFormHandler({
  schema: uploadSchema,
  endpoint: "/api/upload",
  useFormData: true,  // auto-sets Content-Type: multipart/form-data
});

<input
  type="file"
  onChange={(e) => setValue("avatar", e.target.files?.[0])}
/>
```

### Request Cancellation

```tsx
const { onSubmit, abort, loading } = useFormHandler({
  schema: reportSchema,
  endpoint: "/api/generate",
  enableAbort: true,
});

<form onSubmit={onSubmit}>
  <button type="submit" disabled={loading}>Generate</button>
  {loading && <button type="button" onClick={abort}>✕ Cancel</button>}
</form>
```

### Optimistic Updates

```tsx
const { onSubmit } = useFormHandler({
  schema: taskSchema,
  endpoint: "/api/tasks/42",
  method: "patch",
  onMutate: async (newData) => {
    const previous = currentTask;
    setTask((prev) => ({ ...prev, ...newData }));
    return { previous };
  },
  onError: (_error, context) => {
    setTask(context.previous); // rollback
  },
});
```

### Custom Response & Error Parsers

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
    message: err.response?.data?.errorDescription ?? err.message ?? "Something went wrong",
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
import { toast } from "sonner";
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
    reset,         // resets both form AND mutation
    resetForm,     // resets only the form
    resetMutation,
    status,
  } = useFormMutation({
    schema: postSchema,
    endpoint: "/api/posts",           // uses fetch automatically
    notify: (msg, type) => toast[type](msg),
    mutationOptions: {
      retry: 2,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register("title")} placeholder="Title" />
      <textarea {...register("content")} placeholder="Content" />
      {formError && <p>Form: {formError.message}</p>}
      {isError && <p>Error: {error?.message}</p>}
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

Create a pre-configured hook with your app-wide defaults:

```ts
// lib/form.ts
import { createFormHandler } from "@hirely/hooks";
import { toast } from "sonner";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export const useAppForm = createFormHandler({
  axiosInstance: api,
  notify: (msg, type) => toast[type](msg),
  mode: "onBlur",
  resetOptions: { resetAfterSuccess: true, keepDefaultValues: false },
});
```

```tsx
// Any component — inherits baseURL, axiosInstance, notify, etc.
import { useAppForm } from "@/lib/form";

const { register, onSubmit } = useAppForm({
  schema: mySchema,
  endpoint: "/resource",
});
```

### Context — `FormHandlerProvider`

Scope defaults to a sub-tree of your app:

```tsx
import { FormHandlerProvider } from "@hirely/hooks";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <FormHandlerProvider
      defaultOptions={{
        axiosInstance: adminAxios,
        notify: (msg, type) => adminToast[type](msg),
        resetOptions: { resetAfterSuccess: false },
      }}
    >
      {children}
    </FormHandlerProvider>
  );
}
```

---

## Higher-Order Component — `withFormHandler`

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
        <button type="submit" disabled={formHandler.loading}>Submit</button>
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