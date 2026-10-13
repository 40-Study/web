/**
 * Quyết định chủ dự án 13/10: khoá `archived` ngừng bán, thêm vào giỏ / ghi danh mới trả 409 COURSE_NOT_FOR_SALE.
 * Trước đây hai hook này chỉ báo câu chung ("Không thể thêm vào giỏ hàng", "Vui lòng thử lại sau") — người dùng bấm
 * lại vô ích vì không biết khoá đã ngừng bán.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { cartService } from "@/services/cart.service";
import { courseService } from "@/services/course.service";
import { useEnrollCourse } from "@/hooks/use-courses";
import { useAddToCart } from "./use-cart";

const notForSale = () => new ApiError(409, "COURSE_NOT_FOR_SALE", "Khóa học này đã ngừng bán nên không thể thêm vào giỏ hàng, mua hoặc ghi danh mới.");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  toast.error.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("khoá ngừng bán", () => {
  it("thêm vào giỏ: báo khoá đã ngừng bán", async () => {
    vi.spyOn(cartService, "addToCart").mockRejectedValue(notForSale());
    const { result } = renderHook(() => useAddToCart(), { wrapper });
    act(() => result.current.mutate("c1"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(String(toast.error.mock.calls[0][0])).toMatch(/ngừng bán/);
  });

  it("thêm vào giỏ thất bại vì lý do khác: vẫn câu chung cũ", async () => {
    vi.spyOn(cartService, "addToCart").mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAddToCart(), { wrapper });
    act(() => result.current.mutate("c1"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Không thể thêm vào giỏ hàng"));
  });

  it("ghi danh: mô tả lỗi nói khoá đã ngừng bán", async () => {
    vi.spyOn(courseService, "enroll").mockRejectedValue(notForSale());
    const { result } = renderHook(() => useEnrollCourse(), { wrapper });
    act(() => result.current.mutate("c1"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error.mock.calls[0][0]).toBe("Đăng ký thất bại");
    expect(String(toast.error.mock.calls[0][1].description)).toMatch(/ngừng bán/);
  });
});
