/**
 * Q6-PG-19: sai mật khẩu / 429 là kết quả bình thường (đã có toast riêng), không được ghi console.error
 * (bộ QA tự động coi console.error là lỗi). Lỗi bất ngờ (không phải ApiError) vẫn được ghi lại.
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

import { useLogin } from "./use-auth";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { AuthError, RateLimitError } from "@/lib/errors";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

async function loginWith(error: unknown) {
  mockApi.post.mockRejectedValue(error);
  const { result } = renderHook(() => useLogin(), { wrapper });
  act(() => result.current.mutate({ email: "a@b.co", password: "x" } as never));
  await waitFor(() => expect(result.current.isError).toBe(true));
}

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  resetMockApi();
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

describe("useLogin — console.error", () => {
  it("sai mật khẩu (AuthError) không ghi console.error", async () => {
    await loginWith(new AuthError("Email hoặc mật khẩu không đúng"));
    expect(consoleError).not.toHaveBeenCalled();
  });
  it("429 (RateLimitError) không ghi console.error", async () => {
    await loginWith(new RateLimitError());
    expect(consoleError).not.toHaveBeenCalled();
  });
  it("lỗi bất ngờ vẫn được ghi", async () => {
    await loginWith(new TypeError("boom"));
    expect(consoleError).toHaveBeenCalledWith("Login error:", expect.any(TypeError));
  });
});
