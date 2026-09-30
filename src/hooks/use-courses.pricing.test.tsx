import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { courseService, type ApiCourse } from "@/services/course.service";
import { mapApiCourse, useCourseBySlug } from "./use-courses";

function apiCourse(over: Partial<ApiCourse> = {}): ApiCourse {
  return { id: "c1", title: "Khoá test", price: 999000, ...over };
}

// Backend: `discount_price` là GIÁ BÁN (sale price), không phải giá gốc. Order/cart tính tiền theo
// Course.EffectivePrice (backend/internal/model/course_pricing.go): discount hợp lệ khi
// 0 <= discount < price. Trước đây web map ngược (price = giá niêm yết, originalPrice = discount)
// nên `originalPrice > price` không bao giờ đúng -> khoá giảm giá hiện giá gốc, mất badge "-x%".
describe("mapApiCourse — discount_price là giá bán, price/originalPrice map đúng chiều", () => {
  it("seed demo (999000 / 499000) -> price=499000, originalPrice=999000", () => {
    const c = mapApiCourse(apiCourse({ price: 999000, discount_price: 499000 }));
    expect(c.price).toBe(499000);
    expect(c.originalPrice).toBe(999000);
  });

  it("CourseCard hasDiscount (originalPrice > price) đúng khi có giảm giá", () => {
    const c = mapApiCourse(apiCourse({ price: 999000, discount_price: 499000 }));
    expect(c.originalPrice !== undefined && c.originalPrice > c.price).toBe(true);
  });

  it("backend trả decimal dạng chuỗi -> vẫn ra số đúng chiều", () => {
    const c = mapApiCourse(apiCourse({ price: "999000.00", discount_price: "499000.00" }));
    expect(c.price).toBe(499000);
    expect(c.originalPrice).toBe(999000);
  });

  it("discount_price = 0 (hợp lệ theo backend: không âm, < price) -> giá bán 0đ", () => {
    const c = mapApiCourse(apiCourse({ price: 999000, discount_price: 0 }));
    expect(c.price).toBe(0);
    expect(c.originalPrice).toBe(999000);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["chuỗi rỗng", ""],
    ["không phải số", "abc"],
    ["âm", -1],
    ["bằng giá gốc", 999000],
    ["cao hơn giá gốc", 1200000],
  ])("discount_price %s -> không giảm giá: giữ giá niêm yết, không có originalPrice", (_label, discount) => {
    const c = mapApiCourse(
      apiCourse({ price: 999000, discount_price: discount as unknown as number | undefined }),
    );
    expect(c.price).toBe(999000);
    expect(c.originalPrice).toBeUndefined();
  });

  it("price thiếu/không hợp lệ -> 0 và không có giảm giá", () => {
    const c = mapApiCourse(apiCourse({ price: undefined, discount_price: 499000 }));
    expect(c.price).toBe(0);
    expect(c.originalPrice).toBeUndefined();
  });
});

describe("useCourseBySlug — trang chi tiết khoá dùng cùng quy tắc giá", () => {
  it("khoá có discount_price -> price=giá bán, originalPrice=giá niêm yết", async () => {
    vi.spyOn(courseService, "getCourseBySlug").mockResolvedValue(
      apiCourse({ slug: "khoa-test", price: 999000, discount_price: 499000 }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCourseBySlug("khoa-test"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.price).toBe(499000);
    expect(result.current.data?.originalPrice).toBe(999000);
  });
});
