/**
 * Q9-PG-05: đăng nhập tài khoản đã tự vô hiệu hoá (401 `ERR_ACCOUNT_DELETED`) phải nói "đã bị xoá", không phải "bị khoá"
 * như khi admin khoá. Backend cũ vẫn trả ACCOUNT_LOCKED nên nhánh khoá cũ giữ nguyên.
 * Xoá tài khoản sai mật khẩu: lỗi nằm dưới ô nhập, hook không toast thêm.
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

import { useDeleteAccount, useLogin } from "./use-auth";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { ApiError, AuthError } from "@/lib/errors";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  resetMockApi();
  toast.error.mockReset();
});

async function loginWith(error: unknown) {
  mockApi.post.mockRejectedValue(error);
  const { result } = renderHook(() => useLogin(), { wrapper });
  act(() => result.current.mutate({ email: "a@b.co", password: "x" } as never));
  await waitFor(() => expect(result.current.isError).toBe(true));
}

describe("useLogin — tài khoản tự xoá (Q9-PG-05)", () => {
  it("ERR_ACCOUNT_DELETED: 'Tài khoản đã bị xoá' + hướng dẫn liên hệ hỗ trợ, không nói 'bị khoá'", async () => {
    await loginWith(new AuthError("Tài khoản đã bị xoá", "ERR_ACCOUNT_DELETED"));
    expect(toast.error).toHaveBeenCalledWith("Tài khoản đã bị xoá", { description: "Liên hệ hỗ trợ nếu muốn khôi phục." });
  });

  it("backend cũ: ACCOUNT_LOCKED vẫn là 'Tài khoản đã bị khoá'", async () => {
    await loginWith(new AuthError("Tài khoản đã bị khoá", "ACCOUNT_LOCKED"));
    expect(toast.error).toHaveBeenCalledWith("Tài khoản đã bị khoá", expect.anything());
  });
});

describe("useDeleteAccount — toast (Q9-PG-05)", () => {
  async function deleteWith(error: unknown) {
    mockApi.delete.mockRejectedValue(error);
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });
    act(() => result.current.mutate({ password: "x" }));
    await waitFor(() => expect(result.current.isError).toBe(true));
  }

  it("sai mật khẩu: không toast (lỗi nằm dưới ô nhập)", async () => {
    await deleteWith(new ApiError(400, "ERR_VALIDATION", "incorrect password"));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("5xx: vẫn toast", async () => {
    await deleteWith(new ApiError(500, "ERR_INTERNAL", "boom"));
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
