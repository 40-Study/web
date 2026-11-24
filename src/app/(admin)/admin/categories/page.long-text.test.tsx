/**
 * QA5-A03: tên 64 ký tự / mô tả 120 ký tự liền không khoảng trắng làm danh mục tràn thẻ và cả trang
 * (683px ở 1280, 1108px ở 390). jsdom không dàn trang nên ghim lớp CSS ngắt từ trên đúng các nút.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const LONG_NAME = "N".repeat(64);
const LONG_DESC = "d".repeat(120);
const cat = { id: "c1", name: LONG_NAME, description: LONG_DESC, is_active: true, created_at: "2026-11-20T00:00:00Z" };

vi.mock("@/hooks/queries/use-categories", () => ({
  useCategoryList: () => ({ data: [cat], isLoading: false, isError: false, refetch: vi.fn() }),
  useCreateCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCategory: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AdminCategoriesPage from "./page";

describe("AdminCategoriesPage — chuỗi dài không khoảng trắng", () => {
  it("tên và mô tả trong danh sách được phép ngắt từ", () => {
    render(<AdminCategoriesPage />);
    expect(screen.getByRole("heading", { level: 3, name: LONG_NAME }).className).toContain("break-words");
    const desc = screen.getByText(LONG_DESC);
    expect(desc.className).toContain("break-words");
    expect(desc.className).toContain("min-w-0");
  });

  it("khung chi tiết cũng ngắt từ", () => {
    render(<AdminCategoriesPage />);
    fireEvent.click(screen.getByRole("heading", { level: 3, name: LONG_NAME }));
    for (const label of ["Tên:", "Mô tả:"]) {
      expect(screen.getByText(label).closest("p")?.className).toContain("break-words");
    }
  });
});
