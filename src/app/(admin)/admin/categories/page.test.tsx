/**
 * QA B-15: bấm "Tạo" với tên rỗng không có phản hồi nào; tạo trùng tên chỉ báo "Không thể tạo danh mục" chung chung.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock("@/hooks/queries/use-categories", () => ({
  useCategoryList: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  useCreateCategory: () => ({ mutate: hooks.createMutate, isPending: false }),
  useUpdateCategory: () => ({ mutate: hooks.updateMutate, isPending: false }),
  useDeleteCategory: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AdminCategoriesPage from "./page";

beforeEach(() => {
  hooks.createMutate.mockReset();
});

describe("AdminCategoriesPage — kiểm tên danh mục", () => {
  it("tên rỗng: hiện thông báo cụ thể, KHÔNG gọi API tạo", () => {
    render(<AdminCategoriesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    expect(screen.getByRole("alert").textContent).toBe("Vui lòng nhập tên danh mục");
    expect(hooks.createMutate).not.toHaveBeenCalled();
  });

  it("tên chỉ có khoảng trắng cũng bị chặn; gõ lại thì thông báo biến mất", () => {
    render(<AdminCategoriesPage />);
    const input = screen.getByLabelText("Tên danh mục");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));
    expect(screen.getByRole("alert")).toBeTruthy();

    fireEvent.change(input, { target: { value: "Lập trình" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("tên hợp lệ: gửi tên đã cắt khoảng trắng hai đầu", () => {
    render(<AdminCategoriesPage />);

    fireEvent.change(screen.getByLabelText("Tên danh mục"), { target: { value: "  Thiết kế  " } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    expect(hooks.createMutate).toHaveBeenCalledWith({ name: "Thiết kế", description: undefined }, expect.anything());
  });

  it("không còn chữ kỹ thuật (API, POST/PUT/DELETE) trong mô tả trang", () => {
    const { container } = render(<AdminCategoriesPage />);
    expect(container.textContent).not.toMatch(/API|POST|PUT|DELETE/);
  });
});