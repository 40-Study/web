/**
 * QA6-A12: bấm chip trạng thái ("Nháp") không ghi gì vào URL nên tải lại trả về "Tất cả", trong khi trang tổng quan
 * link tới `/org/classes?status=...`. Chip phải đồng bộ `?status=` như trang người dùng và nhật ký.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ replace: vi.fn(), search: "" }));
const query = vi.hoisted(() => ({ useOrgClasses: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  usePathname: () => "/org/classes",
  useSearchParams: () => new URLSearchParams(nav.search),
}));

vi.mock("@/hooks/queries/use-org-area", () => ({
  useActiveOrgId: () => "org-1",
  useOrgClasses: (...args: unknown[]) => query.useOrgClasses(...args),
}));

import OrgClassesPage from "./page";

beforeEach(() => {
  nav.replace.mockReset();
  nav.search = "";
  query.useOrgClasses.mockReset();
  query.useOrgClasses.mockReturnValue({
    data: { classes: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  });
});

describe("/org/classes — chip trạng thái ghi vào URL", () => {
  it("bấm 'Nháp' -> router.replace('/org/classes?status=draft') và lọc theo trạng thái đó", () => {
    render(<OrgClassesPage />);
    fireEvent.click(screen.getByRole("button", { name: "Nháp" }));

    expect(nav.replace).toHaveBeenCalledWith("/org/classes?status=draft", { scroll: false });
    expect(query.useOrgClasses).toHaveBeenLastCalledWith("org-1", expect.objectContaining({ status: "draft" }));
  });

  it("bấm lại 'Tất cả' -> bỏ ?status khỏi URL", () => {
    nav.search = "status=draft";
    render(<OrgClassesPage />);
    fireEvent.click(screen.getByRole("button", { name: "Tất cả" }));

    expect(nav.replace).toHaveBeenCalledWith("/org/classes", { scroll: false });
  });

  it("mở /org/classes?status=draft: chip 'Nháp' đang bật (URL -> chip vẫn chạy)", () => {
    nav.search = "status=draft";
    render(<OrgClassesPage />);

    expect(screen.getByRole("button", { name: "Nháp" }).getAttribute("aria-pressed")).toBe("true");
  });
});
