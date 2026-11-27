/**
 * Q10-ADMIN-03: tài khoản do người dùng tự xoá và tài khoản bị admin khoá đều hiện "Đã khoá" + "Mở khoá", nên admin có
 * thể âm thầm khôi phục tài khoản người dùng đã chủ động xoá. Danh sách phải phân biệt hai loại.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAdminUsers = vi.fn();
const mutateAsync = vi.fn();
const replace = vi.fn();
const nav = vi.hoisted(() => ({ search: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => "/admin/users",
  useSearchParams: () => new URLSearchParams(nav.search),
  useParams: () => ({}),
}));
vi.mock("@/hooks/queries/use-admin-users", () => ({
  useAdminUsers: (...args: unknown[]) => mockUseAdminUsers(...args),
  useUpdateUserStatus: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("@/hooks/queries/use-admin", () => ({
  useSystemRoles: () => ({ data: [], isSuccess: true, isPending: false, isError: false }),
}));
vi.mock("@/stores/auth.store", () => {
  const state = { user: { id: "admin-1" }, permissions: ["USERS_VIEW_ALL", "USERS_BAN"], sessionStatus: "authenticated" };
  return { useAuthStore: (selector: (s: typeof state) => unknown) => selector(state) };
});

import AdminUsersPage from "../page";

const base = {
  avatar_url: null, is_verified: true, last_login_at: null, created_at: "2026-09-01T00:00:00Z", system_roles: [],
  user_name: "u", full_name: null,
};
const LOCKED = { ...base, id: "u-locked", email: "locked@example.com", is_active: false, locked_reason: "Spam", locked_at: "2026-11-26T00:00:00Z", self_deleted_at: null };
const DELETED = { ...base, id: "u-deleted", email: "deleted@example.com", is_active: false, locked_reason: null, locked_at: null, self_deleted_at: "2026-11-27T08:00:00Z" };
const OLD_BACKEND = { ...base, id: "u-old", email: "old@example.com", is_active: false, locked_reason: null, locked_at: null };

const row = (email: string) => screen.getByRole("link", { name: email }).closest("tr") as HTMLElement;

beforeEach(() => {
  nav.search = "";
  mutateAsync.mockReset().mockResolvedValue(undefined);
  mockUseAdminUsers.mockReturnValue({
    data: { items: [LOCKED, DELETED, OLD_BACKEND], total_count: 3, page: 1, limit: 20, total_pages: 1 },
    isLoading: false, isError: false, error: undefined, refetch: vi.fn(),
  });
});

describe("AdminUsersPage — Q10-ADMIN-03 tự xoá khác bị khoá", () => {
  it("badge: tự xoá = 'Đã tự xoá'; khoá và backend cũ (không có trường) = 'Đã khoá'", () => {
    render(<AdminUsersPage />);
    expect(within(row("deleted@example.com")).getByText("Đã tự xoá")).toBeTruthy();
    expect(within(row("deleted@example.com")).queryByText("Đã khoá")).toBeNull();
    expect(within(row("locked@example.com")).getByText("Đã khoá")).toBeTruthy();
    expect(within(row("old@example.com")).getByText("Đã khoá")).toBeTruthy();
  });

  it("hành động: tự xoá = 'Khôi phục'; khoá = 'Mở khoá'", () => {
    render(<AdminUsersPage />);
    expect(within(row("deleted@example.com")).getByRole("button", { name: /Khôi phục/ })).toBeTruthy();
    expect(within(row("deleted@example.com")).queryByRole("button", { name: /Mở khoá/ })).toBeNull();
    expect(within(row("locked@example.com")).getByRole("button", { name: /Mở khoá/ })).toBeTruthy();
  });

  it("khôi phục: hộp xác nhận nói rõ người dùng tự xoá, rồi gửi is_active=true kèm restore", async () => {
    render(<AdminUsersPage />);
    fireEvent.click(within(row("deleted@example.com")).getByRole("button", { name: /Khôi phục/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Khôi phục tài khoản");
    expect(dialog.textContent).toContain("tự xoá");
    fireEvent.click(within(dialog).getByRole("button", { name: "Khôi phục" }));
    expect(mutateAsync).toHaveBeenCalledWith({ id: "u-deleted", data: { is_active: true }, restore: true });
  });

  it("mở khoá tài khoản bị khoá: hộp thoại cũ, không có restore", () => {
    render(<AdminUsersPage />);
    fireEvent.click(within(row("locked@example.com")).getByRole("button", { name: /Mở khoá/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).not.toContain("tự xoá");
    fireEvent.click(within(dialog).getByRole("button", { name: "Mở khoá" }));
    expect(mutateAsync).toHaveBeenCalledWith({ id: "u-locked", data: { is_active: true } });
  });
});

// Q10 #147 L1: backend chỉ có status=active|locked (= is_active), nên "Đã khoá" từng trả cả tài khoản tự xoá.
describe("AdminUsersPage — Q10 #147 L1 bộ lọc 'Đã khoá' / 'Đã tự xoá'", () => {
  const lastParams = () => mockUseAdminUsers.mock.calls.at(-1)?.[0] as { status?: string };
  const emails = () => screen.getAllByRole("link").map((a) => a.textContent).filter((t) => t?.includes("@"));

  it("?status=locked: gửi status=locked, bảng chỉ còn tài khoản bị khoá (cả backend cũ), KHÔNG có tài khoản tự xoá", () => {
    nav.search = "status=locked";
    render(<AdminUsersPage />);
    expect(lastParams().status).toBe("locked");
    expect(emails()).toEqual(["locked@example.com", "old@example.com"]);
  });

  it("?status=self-deleted: vẫn gửi status=locked (backend không có giá trị riêng), bảng chỉ còn tài khoản tự xoá", () => {
    nav.search = "status=self-deleted";
    render(<AdminUsersPage />);
    expect(lastParams().status).toBe("locked");
    expect(emails()).toEqual(["deleted@example.com"]);
  });

  it("nói rõ việc tách chỉ làm trong trang đang xem; không hiện khi không dùng bộ lọc tách", () => {
    nav.search = "status=locked";
    const { unmount } = render(<AdminUsersPage />);
    expect(screen.getByText(/Backend chưa có bộ lọc riêng cho tài khoản tự xoá/)).toBeTruthy();
    unmount();

    nav.search = "";
    render(<AdminUsersPage />);
    expect(screen.queryByText(/Backend chưa có bộ lọc riêng/)).toBeNull();
    expect(emails()).toHaveLength(3);
  });

  it("trang server toàn tài khoản tự xoá + lọc 'Đã khoá': không nói 'Không tìm thấy', còn phân trang để sang trang khác", () => {
    nav.search = "status=locked";
    mockUseAdminUsers.mockReturnValue({
      data: { items: [DELETED], total_count: 25, page: 1, limit: 20, total_pages: 2 },
      isLoading: false, isError: false, error: undefined, refetch: vi.fn(),
    });
    render(<AdminUsersPage />);
    expect(screen.queryByText("Không tìm thấy người dùng nào")).toBeNull();
    expect(screen.getByText(/Trang này không có tài khoản thuộc loại đã chọn/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Trang sau" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

