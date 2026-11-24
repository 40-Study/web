/**
 * QA6-A01: "Sửa" ở danh mục thấp của danh sách dài mở form ở cột phải, ngoài tầm nhìn nên nút trông như hỏng.
 * Sau khi bấm, form phải được cuộn vào khung nhìn và ô tên nhận focus (vị trí thật đo bằng trình duyệt).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const categories = Array.from({ length: 14 }, (_, i) => ({
  id: `c${i}`,
  name: `Danh mục ${i}`,
  description: `Mô tả ${i}`,
  is_active: true,
  created_at: "2026-11-20T00:00:00Z",
}));

vi.mock("@/hooks/queries/use-categories", () => ({
  useCategoryList: () => ({ data: categories, isLoading: false, isError: false, refetch: vi.fn() }),
  useCreateCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCategory: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AdminCategoriesPage from "./page";

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockReset();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  // @ts-expect-error jsdom không định nghĩa scrollIntoView; trả về trạng thái gốc cho test khác.
  delete Element.prototype.scrollIntoView;
});

describe("AdminCategoriesPage — QA6-A01 form sửa vào tầm nhìn", () => {
  it("bấm 'Sửa' ở danh mục cuối: form được cuộn vào khung nhìn và ô tên có focus", () => {
    render(<AdminCategoriesPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "Sửa" })[13]);

    const nameInput = screen.getByLabelText("Tên danh mục") as HTMLInputElement;
    expect(nameInput.value).toBe("Danh mục 13");
    expect(document.activeElement).toBe(nameInput);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(nameInput.closest("form"));
  });
});
