import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicApiBaseUrl } from "../base-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getPublicApiBaseUrl", () => {
  it("uses the absolute backend URL for production server fetches", () => {
    vi.stubEnv("BACKEND_URL", "https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api");

    expect(getPublicApiBaseUrl()).toBe("https://api.example.com/api");
  });

  it("does not pass a relative browser URL to Node fetch", () => {
    vi.stubEnv("BACKEND_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api");

    expect(getPublicApiBaseUrl()).toBe("http://localhost:5000/api");
  });
});
