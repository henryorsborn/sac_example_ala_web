import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Stub import.meta.env so we can drive VITE_API_BASE_URL per test.
const setViteEnv = (value: string | undefined) => {
  // Vitest's vite/client types expose import.meta.env with a mutable `Record`.
  // We assign via type-narrowing because the global type is not writable.
  (import.meta.env as unknown as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL = value;
};

// Each test re-imports the module so import.meta.env is read fresh.
const freshImport = async () => {
  vi.resetModules();
  return await import("@/api/client");
};

describe("apiClient (axios instance)", () => {
  beforeEach(() => {
    setViteEnv(undefined);
  });

  afterEach(() => {
    setViteEnv(undefined);
  });

  it("falls back to '/api' when VITE_API_BASE_URL is unset", async () => {
    const { apiClient } = await freshImport();
    expect(apiClient.defaults.baseURL).toBe("/api");
  });

  it("uses VITE_API_BASE_URL when set", async () => {
    setViteEnv("https://api.example.com");
    const { apiClient } = await freshImport();
    expect(apiClient.defaults.baseURL).toBe("https://api.example.com");
  });

  it("sets a 15-second timeout (matches the contract in api/client.ts)", async () => {
    const { apiClient } = await freshImport();
    expect(apiClient.defaults.timeout).toBe(15_000);
  });

  it("sets the JSON Content-Type header by default", async () => {
    const { apiClient } = await freshImport();
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
  });
});