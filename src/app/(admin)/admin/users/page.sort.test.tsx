/** ADM-L2 (QA2 261013): bảng người dùng có cột sắp xếp được (Ngày tạo, Đăng nhập cuối...). */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

const mk = vi.hoisted(() => (id: string, created: string, login: string | null) => ({
  id, email: `${id}@x.vn`, user_name: id, full_name: null, avatar_url: null, is_active: true, is_verified: true,
  locked_reason: null, locked_at: null, last_login_at: login, created_at: created, system_roles: [],
}));

vi.mock("@/services/user.service", () => ({
  userService: {
    list: vi.fn().mockResolvedValue({
      items: [
        mk("aa", "2026-01-01T00:00:00Z", null),
        mk("bb", "2026-03-01T00:00:00Z", "2026-10-01T00:00:00Z"),
        mk("cc", "2026-02-01T00:00:00Z", "2026-09-01T00:00:00Z"),
      ],
      page: 1, total_pages: 1, total_count: 3,
    }),
  },
}));
vi.mock("@/services/role.service", () => ({ roleService: { listSystemRoles: vi.fn().mockResolvedValue([]) } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/admin/users",
  useSearchParams: () => new URLSearchParams(),
}));

import AdminUsersPage from "./page";

const emails = () =>
  screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0]?.textContent);

describe("/admin/users — sắp xếp cột", () => {
  it("bấm Ngày tạo: giảm dần, bấm lại: tăng dần; header báo aria-sort", async () => {
    useAuthStore.setState({ sessionStatus: "authenticated", permissions: ["USERS_BAN"] } as never);
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AdminUsersPage />
      </QueryClientProvider>
    );
    await screen.findByText("aa@x.vn");
    expect(emails()).toEqual(["aa@x.vn", "bb@x.vn", "cc@x.vn"]);

    await user.click(screen.getByRole("button", { name: /Ngày tạo/ }));
    expect(emails()).toEqual(["bb@x.vn", "cc@x.vn", "aa@x.vn"]);
    expect(screen.getByRole("columnheader", { name: /Ngày tạo/ }).getAttribute("aria-sort")).toBe("descending");

    await user.click(screen.getByRole("button", { name: /Ngày tạo/ }));
    expect(emails()).toEqual(["aa@x.vn", "cc@x.vn", "bb@x.vn"]);

    await user.click(screen.getByRole("button", { name: /Đăng nhập cuối/ }));
    expect(emails()).toEqual(["bb@x.vn", "cc@x.vn", "aa@x.vn"]); // chưa đăng nhập luôn cuối
  });
});
