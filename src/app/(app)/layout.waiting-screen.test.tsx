/**
 * QA-A-06: /messages, /learn trắng tinh (không khung, không spinner) 15-30 giây trên máy chậm. Layout (app)
 * `return null` ở các nhịp chờ (chưa hydrate, đang kiểm tra phiên), nên cả HTML server render cũng rỗng.
 * Các nhịp chờ phải có màn tải; nội dung riêng vẫn không được lộ trước khi biết phiên.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/messages",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/layout/app-shell-layout", () => ({
  AppShellLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}));

import AppLayout from "./layout";

describe("(app) layout — nhịp chờ có màn tải, không trang trắng (QA-A-06)", () => {
  beforeEach(() => {
    useAuthStore.getState().clearServerSession();
  });

  it("chưa hydrate store: hiện 'Đang tải...', không lộ nội dung", () => {
    useAuthStore.setState({ hasHydrated: false, sessionStatus: "checking", isAuthenticated: false });
    render(<AppLayout><p>nội dung riêng</p></AppLayout>);
    expect(screen.getByText("Đang tải...")).toBeTruthy();
    expect(screen.queryByText("nội dung riêng")).toBeNull();
  });

  it("đã hydrate, đang kiểm tra phiên: vẫn là màn tải", () => {
    useAuthStore.setState({ hasHydrated: true, sessionStatus: "checking", isAuthenticated: false });
    render(<AppLayout><p>nội dung riêng</p></AppLayout>);
    expect(screen.getByText("Đang tải...")).toBeTruthy();
    expect(screen.queryByText("nội dung riêng")).toBeNull();
  });
});
