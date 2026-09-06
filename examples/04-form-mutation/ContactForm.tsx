"use client";

import { useFormMutation } from "@hirely/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// ─── Fake API service ─────────────────────────────────────────────────────────
async function sendContact(data: z.infer<typeof contactSchema>) {
  await new Promise((r) => setTimeout(r, 600));
  return { success: true, id: "msg_abc123", message: "Message sent!" };
}

// ─── Inner form (uses useFormMutation) ────────────────────────────────────────
function ContactFormInner() {
  const {
    register,
    onSubmit,
    isPending,
    isError,
    error,
    data,
    status,
    formState: { errors },
  } = useFormMutation({
    schema: contactSchema,
    service: sendContact,
    onSuccess: (response) => {
      console.log("Mutation succeeded:", response);
    },
    // Pass React Query mutation options via mutationOptions
    mutationOptions: {
      onMutate: () => console.log("Mutation started…"),
      onSettled: () => console.log("Mutation settled."),
    },
  });

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Contact Us</h2>

      <div>
        <input {...register("name")} placeholder="Your name" />
        {errors.name && <p style={{ color: "red" }}>{errors.name.message}</p>}
      </div>

      <div>
        <input {...register("email")} placeholder="Email" type="email" />
        {errors.email && <p style={{ color: "red" }}>{errors.email.message}</p>}
      </div>

      <div>
        <textarea {...register("message")} placeholder="Your message" rows={4} />
        {errors.message && <p style={{ color: "red" }}>{errors.message.message}</p>}
      </div>

      {isError && <p style={{ color: "red" }}>{(error as Error)?.message}</p>}

      {status === "success" && data && (
        <p style={{ color: "green" }}>✅ Message sent! Reference: {(data as any).id}</p>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Send Message"}
      </button>

      <p style={{ fontSize: 12, color: "#888" }}>Mutation status: <strong>{status}</strong></p>
    </form>
  );
}

// ─── Wrapper with QueryClientProvider ────────────────────────────────────────
const queryClient = new QueryClient();

export default function ContactForm() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContactFormInner />
    </QueryClientProvider>
  );
}
