"use client";

/**
 * createFormHandler example — pre-configure a hook with shared defaults
 * and reuse it across multiple forms without repeating options.
 */

import { createFormHandler } from "@hirely/hooks";
import { z } from "zod";

// ─── Create a project-wide hook with shared config ────────────────────────────
const useApiForm = createFormHandler({
  notify: (message, type) => {
    // Replace with your toast lib: toast[type](message)
    console.log(`[${type.toUpperCase()}] ${message}`);
  },
  resetOptions: {
    resetAfterSuccess: true,
    keepDefaultValues: true,
  },
  axiosConfig: {
    withCredentials: true,
    headers: { "X-App-Version": "1.0.0" },
  },
});

// ─── Schema ───────────────────────────────────────────────────────────────────
const newsletterSchema = z.object({
  email: z.string().email("Invalid email"),
  topics: z.array(z.string()).min(1, "Select at least one topic"),
});

const TOPICS = ["Engineering", "Design", "Product", "Marketing"];

// ─── Component using the pre-configured hook ──────────────────────────────────
export default function NewsletterForm() {
  const {
    register,
    onSubmit,
    loading,
    error,
    formState: { errors },
  } = useApiForm({
    schema: newsletterSchema,
    endpoint: "/api/newsletter/subscribe",
    method: "post",
    // Only override what you need — shared config is already applied
    onSuccess: () => console.log("Subscribed!"),
  });

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Newsletter Signup</h2>

      <div>
        <input {...register("email")} placeholder="Your email" type="email" />
        {errors.email && <p style={{ color: "red" }}>{errors.email.message}</p>}
      </div>

      <fieldset style={{ border: "1px solid #ccc", padding: 12 }}>
        <legend>Topics you care about</legend>
        {TOPICS.map((topic) => (
          <label key={topic} style={{ display: "block" }}>
            <input {...register("topics")} type="checkbox" value={topic} />
            {" "}{topic}
          </label>
        ))}
        {errors.topics && <p style={{ color: "red" }}>{errors.topics.message}</p>}
      </fieldset>

      {error && <p style={{ color: "red" }}>{error.message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
