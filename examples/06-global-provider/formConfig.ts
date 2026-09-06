/**
 * formConfig.ts
 *
 * The single source of truth for all form behaviour across your app.
 * Import `useAppForm` anywhere instead of `useFormHandler` directly.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  createFormHandler  →  pre-wires shared defaults once   │
 * │  FormHandlerProvider  →  injects config via context     │
 * └─────────────────────────────────────────────────────────┘
 */

import { createFormHandler } from "@hirely/hooks";
import type { NotifyFn, ResponseParser, ErrorParser } from "@hirely/hooks";

// ─── 1. Toast adapter ─────────────────────────────────────────────────────────
// Swap the body with your toast library of choice (sonner, react-hot-toast, etc.)
export const notify: NotifyFn = (message, type) => {
  if (type === "success") {
    // toast.success(message);
    console.log(`✅ ${message}`);
  } else {
    // toast.error(message);
    console.error(`❌ ${message}`);
  }
};

// ─── 2. Response shape adapter ────────────────────────────────────────────────
// Tell the hook how to read your API's response envelope.
// Default shape assumed: { success: boolean, message?: string, data?: any }
export const parseResponse: ResponseParser = (res) => ({
  success: res?.success !== undefined ? Boolean(res.success) : true,
  message: res?.message,
  data: res?.data ?? res,
});

// ─── 3. Error shape adapter ───────────────────────────────────────────────────
// Tell the hook how to extract the error message from a thrown error.
export const parseError: ErrorParser = (err) => {
  // Axios error
  if (err?.isAxiosError) {
    return { message: err.response?.data?.message || err.message || "Request failed" };
  }
  // fetch / standard error
  if (err instanceof Error) {
    return { message: err.message };
  }
  // Server error object
  if (err?.response?.data?.message) {
    return { message: err.response.data.message };
  }
  return { message: "Something went wrong" };
};

// ─── 4. The global hook — use this everywhere instead of useFormHandler ────────
export const useAppForm = createFormHandler({
  notify,
  parseResponse,
  parseError,

  // Auto-reset after every successful submission (clear fields, keep defaults)
  resetOptions: {
    resetAfterSuccess: true,
    keepDefaultValues: true,
  },

  // Shared Axios / fetch settings
  axiosConfig: {
    withCredentials: true, // send cookies on every request
    headers: {
      "X-Client": "web",
    },
  },

  // Validate on every change once the field has been touched
  mode: "onTouched",
  reValidateMode: "onChange",
});
