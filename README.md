# @hirely/hooks

<div align="center">

[![npm version](https://img.shields.io/npm/v/@hirely/hooks.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/@hirely/hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0+-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18_%7C_19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Bun](https://img.shields.io/badge/Bun-Optimized-fbf0df?style=flat-square&logo=bun&logoColor=black)](https://bun.sh)
[![Tests](https://img.shields.io/badge/Tests-100%25_Passing-brightgreen?style=flat-square)](https://github.com/hirely/hooks)

<p align="center">
  <strong>Production-ready, type-safe React form hook with Zod validation, seamless HTTP integration (Axios/fetch/Server Actions), and toast notifications.</strong>
</p>

<p align="center">
  <em>Zero forced runtime dependencies &bull; Built-in render optimizations &bull; Full React 18 & 19 Support</em>
</p>

</div>

---

## Highlights

- 🛡️ **End-to-End Type Safety** &ndash; Define your Zod schema once; get instant compile-time validation and form inference.
- ⚡ **High Performance & Zero-Render Overhead** &ndash; Internal callback ref stabilization guarantees that `onSubmit` and handlers remain referentially stable across re-renders even when passing inline functions.
- 🧩 **Zero Forced Dependencies** &ndash; Works out of the box with custom services, Next.js Server Actions, or native `fetch`. Axios and Sonner are dynamically loaded **only if requested**.
- 🚀 **Cached Module Loading** &ndash; Dynamic imports for optional libraries are cached in memory for sub-millisecond subsequent submissions.
- 🔄 **TanStack Query v5 Ready** &ndash; First-class `useFormMutation` hook combining form management and async mutations.
- 🌐 **Global Defaults** &ndash; Configure once via `createFormHandler` factory or wrap sections with `FormHandlerProvider`.
- 📦 **Modern Dual ESM/CJS Bundle** &ndash; Native ESM (`.mjs`/`.js`), CommonJS (`.cjs`), complete TypeScript definitions (`.d.ts`), and `"use client";` directives for Next.js App Router.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core API](#core-api)
  - [`useFormHandler`](#useformhandleroptions)
  - [Return Value](#return-value)
- [Next.js Server Actions](#using-with-nextjs-server-actions)
- [React Query Integration (`useFormMutation`)](#react-query-integration-useformmutation)
- [Global Configuration](#global-configuration)
  - [Factory Pattern (`createFormHandler`)](#1-factory-pattern-createformhandler)
  - [React Context (`FormHandlerProvider`)](#2-react-context-formhandlerprovider)
- [Higher-Order Component (`withFormHandler`)](#higher-order-component-withformhandler)
- [Recipes & Advanced Usage](#recipes--advanced-usage)
  - [File Uploads (`useFormData`)](#file-uploads-with-formdata)
  - [Request Cancellation (`enableAbort`)](#request-cancellation)
  - [Optimistic Updates](#optimistic-updates)
  - [Native `fetch` Client](#using-native-fetch)
  - [Custom Response & Error Parsers](#custom-response--error-parsers)
- [License](#license)

---

## Installation

```bash
# Bun
bun add @hirely/hooks

# npm
npm install @hirely/hooks

# pnpm
pnpm add @hirely/hooks

# Yarn
yarn add @hirely/hooks
```

### Peer Dependencies

Install the core dependencies:

```bash
# Required
bun add react react-hook-form zod
```

**Optional dependencies** (only required if you use their respective features):

```bash
# For default HTTP client and toast notifications:
bun add axios sonner

# For TanStack React Query integration:
bun add @tanstack/react-query
```

> **Note:** If you pass your own async `service` or `notify` handler, you don't even need `axios` or `sonner`.

---

## Quick Start

```tsx
import { useFormHandler } from "@hirely/hooks";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function LoginForm() {
  const { register, onSubmit, loading, error } = useFormHandler({
    schema: loginSchema,
    endpoint: "/api/auth/login",
    onSuccess: (data) => {
      console.log("Logged in successfully:", data);
    },
  });

  return (
    <form onSubmit={onSubmit} className="form-container">
      <input {...register("email")} type="email" placeholder="Email" />
      <input {...register("password")} type="password" placeholder="Password" />

      {error && <p className="error-text">{error.message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

---

## Core API

### `useFormHandler(options)`

```ts
const form = useFormHandler(options);
```

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `schema` | `ZodType<FieldValues>` | *Required* | Zod schema used for form validation and type inference. |
| `endpoint` | `string` | `undefined` | Target URL (used with Axios if no custom `service` is provided). |
| `method` | `'post' \| 'patch' \| 'put' \| 'delete'` | `'post'` | HTTP method for `endpoint`. |
| `service` | `(data: TData) => Promise<any>` | `undefined` | Custom async function (Server Action, `fetch`, SDK). Overrides `endpoint`. |
| `defaultValues` | `DefaultValues<TData>` | `undefined` | Default values for form fields. |
| `values` | `TData` | `undefined` | Reactive external values synced to the form. |
| `transformData` | `(data: TData) => any` | `undefined` | Transform payload prior to submission. |
| `onMutate` | `(data: TData) => any \| Promise<any>` | `undefined` | Pre-submission hook. Return value is passed as `context` to `onSuccess`/`onError`. |
| `onSuccess` | `(data: any, context?: any) => void` | `undefined` | Callback invoked after a successful submission. |
| `onError` | `(error: any, context?: any) => void` | `undefined` | Callback invoked upon submission failure. |
| `onSubmitStart` | `() => void` | `undefined` | Triggered immediately when submission initiates. |
| `onSubmitEnd` | `() => void` | `undefined` | Triggered when submission concludes (success or error). |
| `notify` | `(message: string, type: 'success' \| 'error') => void` | Sonner toast | Custom notification function. Falls back to Sonner if installed. |
| `resetOptions` | `object` | `{ resetAfterSuccess: true, keepDefaultValues: true }` | Controls form reset behavior on success. |
| `useFormData` | `boolean` | `false` | Automatically converts payload to `FormData` (supports `File` and `Blob`). |
| `enableAbort` | `boolean` | `false` | Enables `abort()` method to cancel in-flight HTTP requests. |
| `axiosConfig` | `Record<string, any>` | `{}` | Additional configuration passed to Axios. |
| `mode` | `'onSubmit' \| 'onBlur' \| 'onChange' \| 'onTouched' \| 'all'` | `'onSubmit'` | React Hook Form validation mode. |
| `reValidateMode`| `'onChange' \| 'onBlur' \| 'onSubmit'` | `'onChange'` | Validation mode on re-renders after submit. |
| `parseResponse` | `(res: any) => { success: boolean, message?: string, data?: any }` | Standard parser | Custom response validator and extractor. |
| `parseError` | `(err: any) => { message: string }` | Axios error parser | Custom error message extractor. |

---

### Return Value

Returns **everything from React Hook Form's `useForm`** (`register`, `watch`, `setValue`, `getValues`, `formState`, `control`, etc.) along with:

| Property | Type | Description |
|---|---|---|
| `onSubmit` | `(e?: unknown) => Promise<void>` | Stable submit handler ready to attach to `<form onSubmit={onSubmit}>`. |
| `loading` | `boolean` | `true` while the async request or service is active. |
| `error` | `Error \| null` | Error object if submission failed. |
| `setError` | `React.Dispatch<React.SetStateAction<Error \| null>>` | Manually set or clear the form error state. |
| `abort` | `(() => void) \| undefined` | Cancels the active in-flight request (active when `enableAbort: true`). |

---

## Using with Next.js Server Actions

Because `service` accepts any standard async function, you can plug in **Next.js Server Actions** directly with full type safety:

```ts
// app/actions/user.ts
"use server";

import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function createUserAction(data: z.infer<typeof createUserSchema>) {
  // Database or external API call
  return { success: true, message: "Account created!", id: "user_123" };
}
```

```tsx
// app/components/SignupForm.tsx
"use client";

import { useFormHandler } from "@hirely/hooks";
import { createUserAction } from "@/app/actions/user";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export function SignupForm() {
  const { register, onSubmit, loading } = useFormHandler({
    schema,
    service: createUserAction,
    onSuccess: (data) => console.log("Created user ID:", data.id),
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register("name")} placeholder="Your name" />
      <input {...register("email")} placeholder="Your email" />
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}
```

---

## React Query Integration (`useFormMutation`)

For projects using **@tanstack/react-query**, `useFormMutation` unites form management with React Query's cache invalidation, mutation tracking, and retry logic:

```tsx
import { useFormMutation } from "@hirely/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(10),
});

export function CreatePost() {
  const queryClient = useQueryClient();

  const {
    register,
    mutate,
    isPending,
    isLoading, // backward compatible alias for isPending
    error,
    reset,      // resets both mutation and form fields
  } = useFormMutation({
    schema: postSchema,
    endpoint: "/api/posts",
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      },
    },
  });

  return (
    <form onSubmit={mutate}>
      <input {...register("title")} placeholder="Title" />
      <textarea {...register("content")} placeholder="Content" />
      <button type="submit" disabled={isPending}>
        {isPending ? "Publishing..." : "Publish Post"}
      </button>
    </form>
  );
}
```

### `useFormMutation` Return Properties

In addition to all form handler properties, it includes:
- `mutate` & `mutateAsync` &ndash; Trigger mutation with typed variables.
- `isPending` &ndash; TanStack Query v5 pending state boolean.
- `isLoading` &ndash; Backwards-compatible alias for `isPending`.
- `isError` & `error` &ndash; Mutation error state.
- `formError` &ndash; Dedicated form-level error (if distinct).
- `data` &ndash; Response data from mutation.
- `reset` &ndash; Atomically resets **both** the form fields and the mutation state.
- `resetForm` & `resetMutation` &ndash; Independent reset triggers.
- `status` &ndash; Current mutation status (`'idle' | 'pending' | 'success' | 'error'`).

---

## Global Configuration

### 1. Factory Pattern (`createFormHandler`)

Create a pre-configured hook with company-wide defaults (such as custom notification libraries or API interceptors):

```tsx
// lib/form.ts
import { createFormHandler } from "@hirely/hooks";

export const useAppForm = createFormHandler({
  mode: "onBlur",
  resetOptions: { resetAfterSuccess: true, keepDefaultValues: false },
  notify: (msg, type) => {
    if (type === "success") console.log("[Success]", msg);
    else console.error("[Error]", msg);
  },
});
```

```tsx
// FeatureComponent.tsx
import { useAppForm } from "@/lib/form";
import { z } from "zod";

const schema = z.object({ query: z.string() });

export function SearchForm() {
  // Inherits global defaults, but you can override any option locally:
  const { register, onSubmit } = useAppForm({
    schema,
    endpoint: "/api/search",
  });

  return <form onSubmit={onSubmit}>...</form>;
}
```

### 2. React Context (`FormHandlerProvider`)

Scope configurations to sub-trees of your component hierarchy:

```tsx
import { FormHandlerProvider } from "@hirely/hooks";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <FormHandlerProvider
      defaultOptions={{
        axiosConfig: { headers: { "X-Admin-Scope": "true" } },
        resetOptions: { resetAfterSuccess: false },
      }}
    >
      {children}
    </FormHandlerProvider>
  );
}
```

Any `useFormHandler` within this tree automatically merges provider defaults with local options.

---

## Higher-Order Component (`withFormHandler`)

For legacy class components or HOC architecture:

```tsx
import React from "react";
import { withFormHandler } from "@hirely/hooks";
import type { useFormHandler } from "@hirely/hooks";
import { z } from "zod";

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  notes: z.string().optional(),
});

type FeedbackProps = {
  formHandler: ReturnType<typeof useFormHandler<typeof feedbackSchema>>;
  category: string;
};

class FeedbackView extends React.Component<FeedbackProps> {
  render() {
    const { formHandler, category } = this.props;
    return (
      <form onSubmit={formHandler.onSubmit}>
        <h3>Category: {category}</h3>
        <input type="number" {...formHandler.register("rating", { valueAsNumber: true })} />
        <button type="submit" disabled={formHandler.loading}>Submit</button>
      </form>
    );
  }
}

export default withFormHandler(FeedbackView, {
  schema: feedbackSchema,
  endpoint: "/api/feedback",
});
```

---

## Recipes & Advanced Usage

### File Uploads with `FormData`

Enable `useFormData: true` to serialize payloads containing `File`, `Blob`, arrays of files, or text fields into standard `FormData`:

```tsx
const uploadSchema = z.object({
  title: z.string(),
  avatar: z.instanceof(File),
});

const { register, onSubmit, setValue } = useFormHandler({
  schema: uploadSchema,
  endpoint: "/api/upload",
  useFormData: true,
});
```

### Request Cancellation

Set `enableAbort: true` to get an `abort()` handle that cleanly cancels running requests:

```tsx
const { onSubmit, abort, loading } = useFormHandler({
  schema: largeReportSchema,
  endpoint: "/api/generate-report",
  enableAbort: true,
});

return (
  <form onSubmit={onSubmit}>
    <button type="submit" disabled={loading}>Generate</button>
    {loading && <button type="button" onClick={abort}>Cancel</button>}
  </form>
);
```

### Optimistic Updates

Use `onMutate` to perform client-side updates before the request completes and rollback on error:

```tsx
const { onSubmit } = useFormHandler({
  schema: updateTaskSchema,
  endpoint: "/api/tasks/1",
  onMutate: async (newData) => {
    const previous = currentTask;
    setTask((prev) => ({ ...prev, ...newData }));
    return { previous }; // passed as `context`
  },
  onError: (error, context) => {
    // Rollback to original state
    setTask(context.previous);
  },
});
```

### Using Native `fetch`

```tsx
const { onSubmit } = useFormHandler({
  schema: itemSchema,
  service: async (data) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Request failed with status " + res.status);
    return res.json();
  },
});
```

### Custom Response & Error Parsers

Adapt `@hirely/hooks` to any API response schema:

```tsx
useFormHandler({
  schema: mySchema,
  endpoint: "/api/custom",
  parseResponse: (res) => ({
    success: res.code === 200,
    message: res.statusText,
    data: res.payload,
  }),
  parseError: (err) => ({
    message: err.response?.data?.errorDescription || err.message || "Operation failed",
  }),
});
```

---

## License

[MIT](LICENSE) © Hirely