"use client";

import { useFormHandler } from "@hirely/hooks";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
const searchSchema = z.object({
  query: z.string().min(1, "Search term is required"),
  category: z.enum(["all", "users", "posts", "tags"]),
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function AbortableSearchForm() {
  const {
    register,
    onSubmit,
    loading,
    error,
    abort,
    formState: { errors },
  } = useFormHandler({
    schema: searchSchema,
    defaultValues: { query: "", category: "all" },
    endpoint: "/api/search",
    method: "post",
    enableAbort: true, // ← enables AbortController support
    onSuccess: (data) => {
      console.log("Search results:", data);
    },
    onError: (err) => {
      if (err?.message === "Request was cancelled") {
        console.log("User cancelled the search.");
      }
    },
  });

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Search</h2>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          {...register("query")}
          placeholder="Search…"
          style={{ flex: 1 }}
        />
        <select {...register("category")}>
          <option value="all">All</option>
          <option value="users">Users</option>
          <option value="posts">Posts</option>
          <option value="tags">Tags</option>
        </select>
      </div>

      {errors.query && <p style={{ color: "red" }}>{errors.query.message}</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>

        {/* The abort button cancels the in-flight request */}
        {loading && abort && (
          <button type="button" onClick={abort} style={{ background: "#e53e3e", color: "#fff" }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
