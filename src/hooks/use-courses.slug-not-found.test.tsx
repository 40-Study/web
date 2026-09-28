import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, NotFoundError } from "@/lib/errors";
import { shouldRetryQuery } from "@/lib/query-client";
import { courseService } from "@/services/course.service";
import { useAuthStore } from "@/stores/auth.store";
import { useCourseBySlug } from "./use-courses";

function wrapper({ children }: { children: React.ReactNode }) {
  // Dùng CHÍNH chính sách retry của app (không tắt retry) để test phản ánh số request thật.
  const client = new QueryClient({ defaultOptions: { queries: { retry: shouldRetryQuery, retryDelay: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// N13 (QA học viên 260928): /courses/qa-hack-course -> slug 404 -> fallback GET /courses/:id với
// chuỗi slug -> 400 "invalid UUID length: 14" đè lên 404 và bị in thẳng ra trang.
describe("useCourseBySlug — slug không tồn tại là 404, không phải lỗi kỹ thuật", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: true, sessionStatus: "authenticated" });
  });

  afterEach(() => {
    useAuthStore.getState().clearServerSession();
  });

  it("slug không phải UUID + 404 -> data=null, KHÔNG gọi fallback theo ID, không retry", async () => {
    const bySlug = vi
      .spyOn(courseService, "getCourseBySlug")
      .mockRejectedValue(new NotFoundError("course not found"));
    const byId = vi
      .spyOn(courseService, "getCourseById")
      .mockRejectedValue(new ApiError(400, "UNKNOWN", "invalid UUID length: 14"));

    const { result } = renderHook(() => useCourseBySlug("qa-hack-course"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(byId).not.toHaveBeenCalled();
    expect(bySlug).toHaveBeenCalledTimes(1);
  });

  it("tham số là UUID (link cũ /courses/<id>) + đã đăng nhập -> vẫn fallback tra theo ID", async () => {
    const id = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
    vi.spyOn(courseService, "getCourseBySlug").mockRejectedValue(new NotFoundError());
    const byId = vi.spyOn(courseService, "getCourseById").mockRejectedValue(new NotFoundError());

    const { result } = renderHook(() => useCourseBySlug(id), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(byId).toHaveBeenCalledWith(id);
    expect(result.current.data).toBeNull();
  });
});
