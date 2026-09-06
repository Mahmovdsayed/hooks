"use client";

import { useFormHandler } from "@hirely/hooks";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Fake service (swap with your real API call) ──────────────────────────────
async function registerUser(data: RegisterFormData) {
  await new Promise((r) => setTimeout(r, 800)); // simulate network
  return { success: true, message: "Account created successfully!" };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RegisterForm() {
  const {
    register,
    onSubmit,
    loading,
    error,
    formState: { errors },
  } = useFormHandler({
    schema: registerSchema,
    service: registerUser,
    resetOptions: {
      resetAfterSuccess: true,   // clear the form on success
      keepDefaultValues: true,
    },
    onSuccess: () => {
      alert("Welcome aboard! 🎉");
    },
    notify: (message, type) => {
      // toast[type](message);
      console.log(`[${type}]`, message);
    },
  });

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Create Account</h2>

      <div>
        <input {...register("name")} placeholder="Full name" />
        {errors.name && <p style={{ color: "red" }}>{errors.name.message}</p>}
      </div>

      <div>
        <input {...register("email")} placeholder="Email" type="email" />
        {errors.email && <p style={{ color: "red" }}>{errors.email.message}</p>}
      </div>

      <div>
        <input {...register("password")} placeholder="Password" type="password" />
        {errors.password && <p style={{ color: "red" }}>{errors.password.message}</p>}
      </div>

      <div>
        <input {...register("confirmPassword")} placeholder="Confirm password" type="password" />
        {errors.confirmPassword && (
          <p style={{ color: "red" }}>{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && <p style={{ color: "red" }}>{error.message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Register"}
      </button>
    </form>
  );
}
