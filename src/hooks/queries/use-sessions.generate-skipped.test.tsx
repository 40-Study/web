/**
 * Q4-T06: sinh buổi học phải báo buổi bị bỏ qua (trường `skipped` cạnh `data`), không chỉ "Đã tạo N buổi".
 * Q4-T21: lưu điểm danh một học viên không được báo "hàng loạt".
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
const toastSuccess = vi.fn();
const toastWarning = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), warning: (...a: unknown[]) => toastWarning(...a), error: vi.fn() },
}));

// eslint-disable-next-line import/first
import { useBulkMarkAttendance, useGenerateSessions } from "./use-sessions";
// eslint-disable-next-line import/first
import { mockApi, resetMockApi } from "@/test/mock-api";
// eslint-disable-next-line import/first
import { createTestQueryClient } from "@/test/utils";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

const SESSION = { id: "s1", date: "2026-11-24", start_time: "18:00", end_time: "20:00" };

describe("useGenerateSessions", () => {
  beforeEach(() => {
    resetMockApi();
    toastSuccess.mockReset();
    toastWarning.mockReset();
  });

  it("có buổi bị bỏ qua: cảnh báo kèm ngày", async () => {
    mockApi.post.mockResolvedValue({
      data: { message: "ok", data: [SESSION], skipped: [{ date: "2026-11-30", reason: "overlap" }] },
    });
    const { result } = renderHook(() => useGenerateSessions("c1"), { wrapper });
    await act(() => result.current.mutateAsync({ start_date: "2026-11-24", end_date: "2026-12-08" }));
    expect(toastWarning).toHaveBeenCalledWith("Đã tạo 1 buổi học, bỏ qua 1 buổi trùng lịch (30/11)");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("backend chưa gửi `skipped`: báo thành công như cũ", async () => {
    mockApi.post.mockResolvedValue({ data: { message: "ok", data: [SESSION, SESSION] } });
    const { result } = renderHook(() => useGenerateSessions("c1"), { wrapper });
    await act(() => result.current.mutateAsync({ start_date: "2026-11-24", end_date: "2026-12-08" }));
    expect(toastSuccess).toHaveBeenCalledWith("Đã tạo 2 buổi học");
  });
});

describe("useBulkMarkAttendance (Q4-T21)", () => {
  it("lưu xong báo 'Đã lưu điểm danh', không nói hàng loạt", async () => {
    resetMockApi();
    toastSuccess.mockReset();
    mockApi.post.mockResolvedValue({ data: { message: "ok", data: [] } });
    const { result } = renderHook(() => useBulkMarkAttendance("s1"), { wrapper });
    await act(() => result.current.mutateAsync({ attendances: [{ student_id: "u1", status: "present" }] }));
    expect(toastSuccess).toHaveBeenCalledWith("Đã lưu điểm danh");
  });
});
