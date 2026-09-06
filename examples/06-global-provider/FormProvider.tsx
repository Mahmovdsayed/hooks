"use client";

/**
 * FormProvider.tsx
 *
 * Place this once at the root of your app (app/layout.tsx or _app.tsx).
 * Every useFormHandler call inside will inherit the global config
 * WITHOUT needing to import or pass anything explicitly.
 *
 * Use this alongside formConfig.ts when you want context-based injection
 * (good for third-party components or deeply nested trees where importing
 * useAppForm directly is inconvenient).
 */

import { FormHandlerProvider } from "@hirely/hooks";
import type { ReactNode } from "react";
import { notify, parseResponse, parseError } from "./formConfig";

interface FormProviderProps {
  children: ReactNode;
}

export function FormProvider({ children }: FormProviderProps) {
  return (
    <FormHandlerProvider
      defaultOptions={{
        // ── Adapters ───────────────────────────────────────────────────────
        notify,
        parseResponse,
        parseError,

        // ── Auto-reset ─────────────────────────────────────────────────────
        resetOptions: {
          resetAfterSuccess: true,
          keepDefaultValues: true,
        },

        // ── HTTP defaults ──────────────────────────────────────────────────
        axiosConfig: {
          withCredentials: true,
          headers: { "X-Client": "web" },
        },

        // ── Validation mode ────────────────────────────────────────────────
        mode: "onTouched",
        reValidateMode: "onChange",
      }}
    >
      {children}
    </FormHandlerProvider>
  );
}
