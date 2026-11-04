import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCoursesMock = vi.fn();
vi.mock("@/services/course.service", () => ({
  courseService: { getCourses: (...args: unknown[]) => getCoursesMock(...args) },
}));

// eslint-disable-next-line import/first
import { useCourses } from "./use-courses";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function apiCourse(i: number, categorySlug: string) {
  return {
    id: `c${i}`,
    title: `Khoá ${i}`,
    price: 0,
    category: { id: categorySlug, name: categorySlug, slug: categorySlug },
  };
}

// QA3 Q2: backend mặc định trả 20/lượt, web chỉ gọi 1 lần nên 52 khoá chỉ thấy 20.
describe("useCourses — lấy đủ mọi trang (QA3 Q2)", () => {
  beforeEach(() => {
    getCoursesMock.mockReset();
  });

  it("trả đủ 52 khoá và lọc danh mục đếm đúng trên toàn bộ dữ liệu", async () => {
    // Backend giả lập trả 20/lượt bất kể page_size để buộc hook phải đi nhiều trang
    const all = Array.from({ length: 52 }, (_, i) => apiCourse(i, i < 6 ? "am-nhac" : "khac"));
    getCoursesMock.mockImplementation(async (params: { page: number }) => ({
      courses: all.slice((params.page - 1) * 20, params.page * 20),
      total: all.length,
    }));
    const { result } = renderHook(() => useCourses({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(52);

    const filtered = renderHook(() => useCourses({ category: "am-nhac" }), { wrapper });
    await waitFor(() => expect(filtered.result.current.isSuccess).toBe(true));
    expect(filtered.result.current.data).toHaveLength(6);
  });
});
