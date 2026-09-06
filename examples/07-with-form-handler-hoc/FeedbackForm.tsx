"use client";

/**
 * withFormHandler HOC example.
 *
 * Use withFormHandler to inject a `formHandler` prop into a component
 * without calling useFormHandler inside it directly.
 * Great for separating form logic from presentational components.
 */

import { withFormHandler } from "@hirely/hooks";
import type { useFormHandler } from "@hirely/hooks";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
const feedbackSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters"),
});

// ─── Presentational component (receives formHandler as a prop) ────────────────
type FeedbackFormProps = {
  formHandler: ReturnType<typeof useFormHandler<typeof feedbackSchema>>;
};

function FeedbackFormUI({ formHandler }: FeedbackFormProps) {
  const { register, onSubmit, loading, error, formState: { errors } } = formHandler;

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Leave Feedback</h2>

      <div>
        <label>Rating (1–5)</label>
        <input {...register("rating")} type="number" min={1} max={5} />
        {errors.rating && <p style={{ color: "red" }}>{errors.rating.message}</p>}
      </div>

      <div>
        <textarea {...register("comment")} placeholder="Your comment…" rows={4} />
        {errors.comment && <p style={{ color: "red" }}>{errors.comment.message}</p>}
      </div>

      {error && <p style={{ color: "red" }}>{error.message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit Feedback"}
      </button>
    </form>
  );
}

// ─── Wrap once — export a ready-to-use component ──────────────────────────────
const FeedbackForm = withFormHandler(FeedbackFormUI, {
  schema: feedbackSchema,
  endpoint: "/api/feedback",
  method: "post",
  notify: (msg, type) => alert(`[${type}] ${msg}`),
  onSuccess: () => console.log("Thank you for your feedback!"),
});

export default FeedbackForm;
