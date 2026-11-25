/**
 * Q7-T01 (C12): backend từ chối thời lượng ngoài 0..1440 bằng 400 ERR_VALIDATION + câu tiếng Việt nêu trường; toast phải
 * hiện câu đó thay vì "Không thể tạo bài học" chung. Backend cũ (message tiếng Anh) vẫn ra câu chung.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/errors";
import { lessonService } from "@/services/lesson.service";
import { useCreateLesson } from "./use-lessons";

vi.mock("@/services/lesson.service", () => ({ lessonService: { createLesson: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function createWith(error: unknown) {
  vi.mocked(lessonService.createLesson).mockRejectedValue(error);
  const { result } = renderHook(() => useCreateLesson("c1", "s1"), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ title: "x" } as never).catch(() => undefined);
  });
}

describe("useCreateLesson — lỗi xác thực (Q7-T01)", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
  });

  it("400 ERR_VALIDATION tiếng Việt nêu trường -> hiện đúng câu đó", async () => {
    await createWith(new ApiError(400, "ERR_VALIDATION", "Thời lượng bài học phải từ 0 đến 1440 phút"));
    expect(toast.error).toHaveBeenCalledWith("Thời lượng bài học phải từ 0 đến 1440 phút");
  });

  it("message tiếng Anh (backend cũ) -> câu chung", async () => {
    await createWith(new ApiError(400, "ERR_VALIDATION", "Key: 'DurationMins' Error:Field validation"));
    expect(toast.error).toHaveBeenCalledWith("Không thể tạo bài học");
  });
});
