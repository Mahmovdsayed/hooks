"use client";

import { useFormHandler } from "@hirely/hooks";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginForm() {
  const {
    register,
    onSubmit,
    loading,
    error,
    formState: { errors },
  } = useFormHandler({
    schema: loginSchema,
    endpoint: "/api/auth/login",
    method: "post",
    onSuccess: (data) => {
      console.log("Logged in!", data);
    },
    onError: (err) => {
      console.error("Login failed:", err);
    },
    notify: (message, type) => {
      // plug in your toast library here, e.g. sonner:
      // toast[type](message);
      alert(`[${type.toUpperCase()}] ${message}`);
    },
  });

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Login</h2>

      <div>
        <input {...register("email")} placeholder="Email" type="email" />
        {errors.email && <p style={{ color: "red" }}>{errors.email.message}</p>}
      </div>

      <div>
        <input {...register("password")} placeholder="Password" type="password" />
        {errors.password && <p style={{ color: "red" }}>{errors.password.message}</p>}
      </div>

      {error && <p style={{ color: "red" }}>{error.message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
