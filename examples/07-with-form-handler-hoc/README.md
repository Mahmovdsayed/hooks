# 07 · HOC Pattern — `withFormHandler`

Demonstrates the Higher-Order Component approach. `withFormHandler` wraps a presentational component and injects the `formHandler` object as a prop — keeping your UI component completely decoupled from hook logic.

## What it shows

| Feature | Details |
|---|---|
| `withFormHandler(Component, options)` | Injects `formHandler` prop automatically |
| Presentational / container split | UI component has no hook calls |
| `displayName` | Auto-set to `WithFormHandler(FeedbackFormUI)` for DevTools |

## When to use

- You want to keep components **pure/presentational**
- You need to inject the same form config into **multiple variants** of a component
- You prefer HOC composition over hooks directly in components

## Key code

```tsx
// 1. Define the UI — accepts formHandler as a prop
function FeedbackFormUI({ formHandler }: { formHandler: ReturnType<typeof useFormHandler<...>> }) {
  const { register, onSubmit, loading } = formHandler;
  return <form onSubmit={onSubmit}>...</form>;
}

// 2. Wrap once with options
const FeedbackForm = withFormHandler(FeedbackFormUI, {
  schema: feedbackSchema,
  endpoint: "/api/feedback",
});

// 3. Use anywhere — no extra props needed
<FeedbackForm />
```
