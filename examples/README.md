# @hirely/hooks — Examples

A collection of copy-paste ready examples covering every feature of the package.
Each folder is self-contained with a working component and its own README.

## Examples

| # | Folder | Hook / Feature | Description |
|---|--------|----------------|-------------|
| 01 | [`01-basic-login`](./01-basic-login/) | `useFormHandler` | POST to an endpoint, validation, loading & error state |
| 02 | [`02-register-with-service`](./02-register-with-service/) | `useFormHandler` + `service` | Custom async function, cross-field Zod validation, auto-reset |
| 03 | [`03-file-upload`](./03-file-upload/) | `useFormData: true` | File upload with automatic `FormData` conversion |
| 04 | [`04-form-mutation`](./04-form-mutation/) | `useFormMutation` | React Query `useMutation` + form, `isPending` / `status` / `data` |
| 05 | [`05-abort-request`](./05-abort-request/) | `enableAbort: true` | Cancel in-flight requests with `AbortController` |
| 06 | [`06-global-provider`](./06-global-provider/) | `FormHandlerProvider` | Share defaults (toast, axios config) across all forms in a subtree |
| 07 | [`07-with-form-handler-hoc`](./07-with-form-handler-hoc/) | `withFormHandler` | HOC pattern — inject `formHandler` as a prop |
| 08 | [`08-create-form-handler`](./08-create-form-handler/) | `createFormHandler` | Pre-configured hook factory for project-wide reuse |

---

## Quick Decision Guide

```
Need React Query?
  ├─ Yes → useFormMutation
  └─ No  → useFormHandler

Need to share config across many forms?
  ├─ Via React context  → FormHandlerProvider
  ├─ Via hook factory   → createFormHandler
  └─ Via HOC            → withFormHandler

Need file upload? → useFormData: true
Need cancellation? → enableAbort: true
Need custom HTTP?  → service: async (data) => { ... }
```

---

## Installation

```bash
npm install @hirely/hooks react-hook-form zod @hookform/resolvers
# optional — for useFormMutation:
npm install @tanstack/react-query
```

## Peer dependencies

| Package | Version |
|---|---|
| `react` | ≥ 18.0.0 |
| `react-hook-form` | ^7.0.0 |
| `zod` | ^3.0.0 \|\| ^4.0.0 |
| `@tanstack/react-query` | ≥ 5.0.0 *(optional)* |
