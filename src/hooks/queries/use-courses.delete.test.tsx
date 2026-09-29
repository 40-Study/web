/**
 * Re-review PR #79: xoá khoá đang chờ duyệt -> backend 409 COURSE_PENDING_REVIEW. Trước đây toast
 * chỉ báo chung "Không thể xóa khóa học"; giờ phải nói rõ lý do bằng tiếng Việt.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/errors";
import { courseService } from "@/services/course.service";
import { useDeleteCourse } from "./use-courses";

vi.mock("@/services/course.service", () => ({
  courseService: { deleteCourse: vi.fn() },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useDeleteCourse — thông báo lỗi", () => {
  beforeEach(() => {
    vi.mocked(courseService.deleteCourse).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("409 COURSE_PENDING_REVIEW -> báo khoá đang chờ duyệt, không phải lỗi chung", async () => {
    vi.mocked(courseService.deleteCourse).mockRejectedValue(
      new ApiError(409, "COURSE_PENDING_REVIEW", "Course is pending review")
    );
    const { result } = renderHook(() => useDeleteCourse(), { wrapper });
    act(() => result.current.mutate("course-1"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(vi.mocked(toast.error).mock.calls[0][0]).toMatch(/đang chờ duyệt/);
  });

  it("lỗi không có mã riêng -> giữ câu chung", async () => {
    vi.mocked(courseService.deleteCourse).mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useDeleteCourse(), { wrapper });
    act(() => result.current.mutate("course-1"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Không thể xóa khóa học"));
  });
});
