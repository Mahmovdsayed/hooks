"use client";

import { useFormHandler } from "@hirely/hooks";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
const avatarSchema = z.object({
  username: z.string().min(2, "Username too short"),
  avatar: z
    .custom<File>((v) => v instanceof File, "Please select a file")
    .refine((f) => f.size <= 4 * 1024 * 1024, "Max file size is 4 MB")
    .refine(
      (f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type),
      "Only JPEG, PNG, or WebP allowed"
    ),
});

type AvatarFormData = z.infer<typeof avatarSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
export default function AvatarUploadForm() {
  const {
    register,
    setValue,
    watch,
    onSubmit,
    loading,
    error,
    formState: { errors },
  } = useFormHandler<typeof avatarSchema>({
    schema: avatarSchema,
    endpoint: "/api/profile/avatar",
    method: "post",
    useFormData: true, // automatically converts payload → FormData
    onSuccess: (data) => {
      console.log("Avatar uploaded!", data);
    },
    notify: (msg, type) => alert(`[${type}] ${msg}`),
  });

  const file = watch("avatar");

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Upload Avatar</h2>

      <div>
        <input {...register("username")} placeholder="Username" />
        {errors.username && <p style={{ color: "red" }}>{errors.username.message}</p>}
      </div>

      <div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) setValue("avatar", selected, { shouldValidate: true });
          }}
        />
        {file && <p style={{ color: "green" }}>Selected: {file.name}</p>}
        {errors.avatar && <p style={{ color: "red" }}>{errors.avatar.message as string}</p>}
      </div>

      {error && <p style={{ color: "red" }}>{error.message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
