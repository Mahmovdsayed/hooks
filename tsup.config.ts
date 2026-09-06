import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: false,
  external: [
    "react",
    "react-hook-form",
    "zod",
    "@tanstack/react-query",
    "axios",
    "sonner",
  ],
  banner: {
    js: '"use client";',
  },
});
