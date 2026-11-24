/** Round 2 (L3, R4): huỷ buổi làm mới lịch giảng dạy; lỗi 422 ERR_SESSION_ALREADY_STARTED hiện câu tiếng Việt. */
import { act, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a), warning: vi.fn() },
}));

// eslint-disable-next-line import/first
import { useCancelSession } from "./use-sessions";
// eslint-disable-next-line import/first
import { classScheduleKeys } from "./use-class-schedule";
// eslint-disable-next-line import/first
import { mockApi, resetMockApi } from "@/test/mock-api";
// eslint-disable-next-line import/first
import { createTestQueryClient } from "@/test/utils";
// eslint-disable-next-line import/first
import { ApiError } from "@/lib/errors";

const qc = createTestQueryClient();
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useCancelSession", () => {
  beforeEach(() => {
    resetMockApi();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it("thành công: làm mới timetable của giảng viên (lịch /teacher/schedule đọc từ đó)", async () => {
    mockApi.delete.mockResolvedValue({ data: { message: "ok" } });
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCancelSession("c1"), { wrapper });
    await act(() => result.current.mutateAsync({ sessionId: "s1" }));
    expect(spy).toHaveBeenCalledWith({ queryKey: classScheduleKeys.all });
    expect(toastSuccess).toHaveBeenCalledWith("Đã huỷ buổi học");
  });

  it("422 ERR_SESSION_ALREADY_STARTED: toast câu tiếng Việt", async () => {
    mockApi.delete.mockRejectedValue(new ApiError(422, "ERR_SESSION_ALREADY_STARTED", "session already started"));
    const { result } = renderHook(() => useCancelSession("c1"), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ sessionId: "s1" }).catch(() => {});
    });
    expect(toastError).toHaveBeenCalledWith("Không thể huỷ buổi học", { description: expect.stringContaining("đã bắt đầu") });
  });
});
