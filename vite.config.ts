/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Listen on all interfaces so this works inside containers / remote dev.
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // Proxy /api requests to the backend during dev so the SPA can use
      // relative paths without CORS gymnastics. The backend URL is read
      // from VITE_API_PROXY_TARGET (set in .env).
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Coverage gate opt-in: enabled when COVERAGE_THRESHOLD is set.
      // The scaffold ships with a small set of tests (App.test.tsx, utils.test.ts,
      // client.test.ts); bump the threshold as you add more.
      thresholds: process.env.COVERAGE_THRESHOLD
        ? {
            lines: Number(process.env.COVERAGE_THRESHOLD),
            statements: Number(process.env.COVERAGE_THRESHOLD),
            functions: Number(process.env.COVERAGE_THRESHOLD),
            branches: Number(process.env.COVERAGE_THRESHOLD),
          }
        : undefined,
    },
  },
});