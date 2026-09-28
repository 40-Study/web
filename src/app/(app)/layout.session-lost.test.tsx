import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

const replace = vi.fn();
let pathname = "/my-courses";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));

// Khung app thật kéo theo sidebar/header/query — không liên quan tới hành vi điều hướng cần khoá.
vi.mock("@/components/layout/app-shell-layout", () => ({
  AppShellLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}));

import AppLayout from "./layout";

// N-08 (QA admin 260928, P1): học viên bị khoá giữa phiên (hoặc phiên hết hạn) → bootstrap đặt
// `anonymous`, layout `return null` và KHÔNG có nhánh điều hướng → trang trắng vĩnh viễn.
describe("(app) layout — mất phiên phải về /login, không trang trắng", () => {
  beforeEach(() => {
    replace.mockReset();
    pathname = "/my-courses";
    window.history.replaceState({}, "", "/my-courses?tab=done");
    useAuthStore.getState().clearServerSession();
    useAuthStore.setState({ hasHydrated: true, sessionStatus: "anonymous", isAuthenticated: false });
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("route cần đăng nhập + anonymous -> router.replace('/login?redirect=<trang hiện tại>')", () => {
    render(<AppLayout><p>nội dung riêng</p></AppLayout>);

    expect(replace).toHaveBeenCalledWith(`/login?redirect=${encodeURIComponent("/my-courses?tab=done")}`);
    expect(screen.getByRole("status").textContent).toContain("Đang chuyển tới trang đăng nhập");
    expect(screen.queryByText("nội dung riêng")).toBeNull();
  });

  // Re-review PR #33 (MAJOR): đăng xuất chủ động từng bị hiểu là mất phiên -> /login?redirect=<trang cũ>.
  it("đăng xuất CHỦ ĐỘNG (store.logout) -> về '/', không gắn ?redirect", () => {
    useAuthStore.getState().logout();

    render(<AppLayout><p>nội dung riêng</p></AppLayout>);

    expect(replace).toHaveBeenCalledWith("/");
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining("redirect="));
    expect(screen.queryByText("nội dung riêng")).toBeNull();
  });

  it("đăng xuất rồi đăng nhập lại -> cờ reset, mất phiên sau đó lại giữ ?redirect", () => {
    const store = useAuthStore.getState();
    store.logout();
    store.applyServerSession({
      user: { id: "u1", email: "a@b.c", name: "A" },
      roles: [],
      activeRole: "STUDENT",
      activeUnifiedRole: null,
      permissions: [],
    });
    expect(useAuthStore.getState().sessionEndedByUser).toBe(false);

    useAuthStore.getState().clearServerSession();
    render(<AppLayout><p>nội dung riêng</p></AppLayout>);

    expect(replace).toHaveBeenCalledWith(`/login?redirect=${encodeURIComponent("/my-courses?tab=done")}`);
  });

  it("đang kiểm tra phiên (checking) -> KHÔNG đá về /login", () => {
    useAuthStore.setState({ sessionStatus: "checking" });

    render(<AppLayout><p>nội dung riêng</p></AppLayout>);

    expect(replace).not.toHaveBeenCalled();
  });

  it("route công khai (/courses) + anonymous -> không điều hướng, vẫn hiện nội dung", () => {
    pathname = "/courses";

    render(<AppLayout><p>danh sách khoá</p></AppLayout>);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText("danh sách khoá")).not.toBeNull();
  });
});
