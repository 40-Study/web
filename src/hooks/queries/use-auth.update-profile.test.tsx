/**
 * Q8-PG-02: 409 ERR_USERNAME_EXISTS đã hiện dưới ô Username của form hồ sơ, nên `useUpdateProfile` KHÔNG bắn thêm toast
 * cho mã này (một lỗi, một chỗ). Lỗi khác vẫn có toast với câu tiếng Việt.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { useUpdateProfile } from "./use-auth";
import { ApiError } from "@/lib/errors";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { createTestQueryClient } from "@/test/utils";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  resetMockApi();
  toast.error.mockReset();
});

describe("useUpdateProfile — lỗi", () => {
  it("ERR_USERNAME_EXISTS: không toast (form hiện lỗi dưới ô Username)", async () => {
    mockApi.put.mockRejectedValue(new ApiError(409, "ERR_USERNAME_EXISTS", "username already exists"));
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    result.current.mutate({ username: "admin" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("lỗi khác vẫn toast câu tiếng Việt", async () => {
    mockApi.put.mockRejectedValue(new ApiError(403, "ERR_FORBIDDEN", "forbidden"));
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    result.current.mutate({ username: "abc" });
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error.mock.calls[0][0]).toMatch(/quyền/);
  });
});
