// app/layout.tsx  (Next.js App Router)
// ──────────────────────────────────────────────────────────────────────────────
// Drop <FormProvider> here once and every page/component that calls
// useFormHandler will automatically get the global config.

import { FormProvider } from "@/examples/06-global-provider/FormProvider";
// or: import { FormProvider } from "@/providers/FormProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ↓ one line — all forms inherit config from here */}
        <FormProvider>
          {children}
        </FormProvider>
      </body>
    </html>
  );
}
