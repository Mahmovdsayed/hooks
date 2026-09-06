"use client";

/**
 * SettingsPage.tsx
 *
 * Demonstrates two patterns for consuming the global config:
 *
 *   Pattern A — useAppForm (direct import, no context needed)
 *   Pattern B — useFormHandler inside <FormProvider> (context-based)
 *
 * Both produce identical runtime behaviour. Pick one per project.
 */

import { z } from "zod";
import { useAppForm } from "./formConfig"; // Pattern A: direct import

// ─── Schemas ──────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  website: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const notificationsSchema = z.object({
  emailDigest: z.boolean(),
  pushAlerts: z.boolean(),
  marketingEmails: z.boolean(),
});

// ─── Profile Form ─────────────────────────────────────────────────────────────
function ProfileForm() {
  // useAppForm inherits: notify, parseResponse, parseError,
  // resetOptions, axiosConfig, mode, reValidateMode
  const {
    register,
    onSubmit,
    loading,
    error,
    formState: { errors, isDirty },
  } = useAppForm({
    schema: profileSchema,
    endpoint: "/api/profile",
    method: "patch",
    defaultValues: { displayName: "Jane Doe", bio: "", website: "" },
    onSuccess: () => console.log("Profile saved"),
  });

  return (
    <section>
      <h3>Profile</h3>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label>Display name</label>
          <input {...register("displayName")} placeholder="Jane Doe" />
          {errors.displayName && <p style={{ color: "red" }}>{errors.displayName.message}</p>}
        </div>

        <div>
          <label>Bio</label>
          <textarea {...register("bio")} placeholder="A few words about you…" rows={3} />
          {errors.bio && <p style={{ color: "red" }}>{errors.bio.message}</p>}
        </div>

        <div>
          <label>Website</label>
          <input {...register("website")} placeholder="https://example.com" type="url" />
          {errors.website && <p style={{ color: "red" }}>{errors.website.message}</p>}
        </div>

        {error && <p style={{ color: "red" }}>{error.message}</p>}

        <button type="submit" disabled={loading || !isDirty}>
          {loading ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </section>
  );
}

// ─── Password Form ────────────────────────────────────────────────────────────
function PasswordForm() {
  const {
    register,
    onSubmit,
    loading,
    error,
    formState: { errors },
  } = useAppForm({
    schema: passwordSchema,
    endpoint: "/api/account/password",
    method: "put",
    // Override global reset for this form — don't wipe passwords on success
    resetOptions: { resetAfterSuccess: false },
    onSuccess: () => console.log("Password updated"),
  });

  return (
    <section>
      <h3>Change Password</h3>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label>Current password</label>
          <input {...register("currentPassword")} type="password" autoComplete="current-password" />
          {errors.currentPassword && (
            <p style={{ color: "red" }}>{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label>New password</label>
          <input {...register("newPassword")} type="password" autoComplete="new-password" />
          {errors.newPassword && <p style={{ color: "red" }}>{errors.newPassword.message}</p>}
        </div>

        <div>
          <label>Confirm new password</label>
          <input {...register("confirmPassword")} type="password" autoComplete="new-password" />
          {errors.confirmPassword && (
            <p style={{ color: "red" }}>{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && <p style={{ color: "red" }}>{error.message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </section>
  );
}

// ─── Notifications Form ───────────────────────────────────────────────────────
function NotificationsForm() {
  const {
    register,
    onSubmit,
    loading,
    error,
  } = useAppForm({
    schema: notificationsSchema,
    endpoint: "/api/account/notifications",
    method: "patch",
    defaultValues: {
      emailDigest: true,
      pushAlerts: false,
      marketingEmails: false,
    },
  });

  return (
    <section>
      <h3>Notifications</h3>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label>
          <input {...register("emailDigest")} type="checkbox" />
          {" "}Weekly email digest
        </label>
        <label>
          <input {...register("pushAlerts")} type="checkbox" />
          {" "}Push alerts
        </label>
        <label>
          <input {...register("marketingEmails")} type="checkbox" />
          {" "}Marketing emails
        </label>

        {error && <p style={{ color: "red" }}>{error.message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save Preferences"}
        </button>
      </form>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <h2>Account Settings</h2>
      <p style={{ color: "#888", fontSize: 13 }}>
        All forms below share one global config (notify, axiosConfig, mode, reset) —
        defined once in <code>formConfig.ts</code>.
      </p>

      <hr />
      <ProfileForm />
      <hr />
      <PasswordForm />
      <hr />
      <NotificationsForm />
    </main>
  );
}
