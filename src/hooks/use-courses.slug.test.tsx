/**
 * A-01 / review R1 MINOR 2: API thiếu `slug` của danh mục thì slug dự phòng phải KHÔNG DẤU (như backend),
 * nếu không chip lọc "Lập trình Web" lại ra 0 khoá âm thầm.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createWrapper } from "@/test-utils/query-wrapper";
import { categoryService } from "@/services/category.service";
import { mapApiCourse, useCategories } from "./use-courses";
import type { ApiCourse } from "@/services/course.service";

describe("slug dự phòng của danh mục", () => {
  it("khoá học có category thiếu slug: slug không dấu", () => {
    const course = mapApiCourse({
      id: "c1",
      title: "React",
      category: { id: "k1", name: "Lập trình Web" },
    } as unknown as ApiCourse);
    expect(course.category.slug).toBe("lap-trinh-web");
  });

  it("useCategories: API thiếu slug thì sinh không dấu, có slug thì dùng nguyên slug của API", async () => {
    vi.spyOn(categoryService, "getAll").mockResolvedValue([
      { id: "k1", name: "Lập trình Web" },
      { id: "k2", name: "Đồ họa", slug: "do-hoa-2" },
    ] as unknown as Awaited<ReturnType<typeof categoryService.getAll>>);

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(result.current.data?.map((c) => c.slug)).toEqual(["lap-trinh-web", "do-hoa-2"]);
  });
});