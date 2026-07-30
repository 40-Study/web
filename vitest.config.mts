import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Khớp `paths` trong tsconfig.json — "@/*" -> "./src/*"
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // e2e/ thuộc Playwright — Vitest không được chạm
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    css: false,
    restoreMocks: true,
  },
});
