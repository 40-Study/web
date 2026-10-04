/**
 * QA B-15: tạo danh mục trùng tên phải báo đúng lý do (bảng dịch lỗi đã có câu "Tên danh mục đã tồn tại"
 * nhưng hook dùng một toast cố định nên không bao giờ tới được người dùng).
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/errors";
import { categoryService } from "@/services/category.service";
import { createWrapper } from "@/test-utils/query-wrapper";
import { useCreateCategory } from "./use-categories";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  vi.mocked(toast.error).mockClear();
});

describe("useCreateCategory — lỗi", () => {
  it("trùng tên: toast nói rõ tên đã tồn tại", async () => {
    vi.spyOn(categoryService, "create").mockRejectedValue(
      new ApiError(400, "ERR_CREATE_CATEGORY", "category with this name already exists")
    );
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });

    act(() => result.current.mutate({ name: "Lập trình Web" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Tên danh mục đã tồn tại"));
  });

  it("lỗi không nhận diện được: về câu chung của nơi gọi", async () => {
    vi.spyOn(categoryService, "create").mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });

    act(() => result.current.mutate({ name: "X" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Không thể tạo danh mục"));
  });
});