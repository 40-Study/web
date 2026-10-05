/**
 * Nút Danh mục trên header (kiểu F8): mở dropdown các danh mục từ useCategories (nguồn chung với
 * pill lọc ở /courses), đóng bằng Esc + click ngoài, mục "Tất cả khóa học" ở cuối, link trỏ
 * /courses?category=<slug>.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCategories = [
  { id: "c1", name: "Lập trình Web", slug: "lap-trinh-web" },
  { id: "c2", name: "Thiết kế", slug: "thiet-ke" },
];
let mockData: typeof mockCategories | undefined = mockCategories;
let mockLoading = false;

vi.mock("@/hooks/use-courses", () => ({
  useCategories: () => ({ data: mockData, isLoading: mockLoading }),
}));

// eslint-disable-next-line import/first
import { CategoryMenu } from "./category-menu";

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Danh mục khóa học" }));
}

describe("CategoryMenu — dropdown Danh mục", () => {
  beforeEach(() => {
    mockData = mockCategories;
    mockLoading = false;
  });

  it("mở dropdown và render các danh mục dưới dạng link", () => {
    render(<CategoryMenu />);
    openMenu();
    const link = screen.getByRole("link", { name: /Lập trình Web/ });
    expect(link.getAttribute("href")).toBe("/courses?category=lap-trinh-web");
    expect(screen.getByRole("link", { name: /Thiết kế/ }).getAttribute("href")).toBe(
      "/courses?category=thiet-ke"
    );
  });

  it("có mục 'Tất cả khóa học' ở cuối trỏ /courses", () => {
    render(<CategoryMenu />);
    openMenu();
    expect(screen.getByRole("link", { name: /Tất cả khóa học/ }).getAttribute("href")).toBe("/courses");
  });

  it("đóng bằng phím Esc", () => {
    render(<CategoryMenu />);
    openMenu();
    expect(screen.getByRole("menu")) != null;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("đóng khi click ra ngoài", () => {
    render(
      <div>
        <div data-testid="outside" />
        <CategoryMenu />
      </div>
    );
    openMenu();
    expect(screen.getByRole("menu")) != null;
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("đang tải thì hiển thị trạng thái loading", () => {
    mockLoading = true;
    mockData = undefined;
    render(<CategoryMenu />);
    openMenu();
    expect(screen.getByText(/Đang tải danh mục/)) != null;
  });

  it("nút có aria-expanded cập nhật khi mở/đóng", () => {
    render(<CategoryMenu />);
    const button = screen.getByRole("button", { name: "Danh mục khóa học" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    openMenu();
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });
});
