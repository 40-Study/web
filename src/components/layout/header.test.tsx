/**
 * QA vòng 2 (F8): menu tài khoản có "Đơn hàng của tôi" -> /orders cho học viên và phụ huynh (trang
 * /orders do lane B thêm nhưng không có lối vào), không hiện cho giảng viên; tên thương hiệu lấy
 * từ siteConfig.name.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/lib/constants";

type AuthState = {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  activeRole: string | null;
  activeUnifiedRole: null;
  roles: never[];
};
let authState: AuthState;

vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => authState }));
vi.mock("@/hooks/queries/use-auth", () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
  useSwitchRole: () => ({ mutate: vi.fn(), isPending: false }),
  useMyRoles: () => ({ data: undefined }),
}));
vi.mock("@/hooks/queries/use-coins", () => ({ useCoinWallet: () => ({ data: { balance: 0 } }) }));
vi.mock("@/hooks/queries/use-notifications", () => ({
  useNotifications: () => ({ data: undefined }),
  useUnreadCount: () => ({ data: undefined }),
  useMarkNotificationRead: () => ({ mutate: vi.fn() }),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/use-notification-socket", () => ({ useNotificationSocket: () => undefined }));
vi.mock("@/components/layout/global-search", () => ({ GlobalSearch: () => null }));
vi.mock("@/components/layout/cart-dropdown", () => ({ CartDropdown: () => null }));
vi.mock("@/components/auth/auth-modal", () => ({ AuthModal: () => null }));

// eslint-disable-next-line import/first
import { Header } from "./header";

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: /Menu tài khoản/ }));
}

describe("Header — menu tài khoản", () => {
  beforeEach(() => {
    authState = {
      isAuthenticated: true,
      user: { name: "Học Viên", email: "hv@demo.com" },
      activeRole: "STUDENT",
      activeUnifiedRole: null,
      roles: [],
    };
  });

  it("học viên thấy 'Đơn hàng của tôi' trỏ /orders", () => {
    render(<Header />);
    openMenu();
    const link = screen.getAllByRole("link", { name: /Đơn hàng của tôi/ })[0];
    expect(link.getAttribute("href")).toBe("/orders");
  });

  it("phụ huynh cũng thấy 'Đơn hàng của tôi'", () => {
    authState.activeRole = "PARENT";
    render(<Header />);
    openMenu();
    expect(screen.getAllByRole("link", { name: /Đơn hàng của tôi/ }).length).toBeGreaterThan(0);
  });

  it("giảng viên KHÔNG thấy 'Đơn hàng của tôi'", () => {
    authState.activeRole = "TEACHER";
    render(<Header />);
    openMenu();
    expect(screen.queryByRole("link", { name: /Đơn hàng của tôi/ })).toBeNull();
  });

  it("logo dùng siteConfig.name", () => {
    render(<Header />);
    expect(screen.getAllByText(siteConfig.name).length).toBeGreaterThan(0);
  });
});

// Lane U (UX-5): phụ huynh không học -> không hiện xu, nút chính trỏ về nơi có tổng quan các con
// (/home) thay vì "Khóa học của tôi" (/my-courses, route chỉ dành cho học viên).
describe("Header — vai phụ huynh", () => {
  beforeEach(() => {
    authState = {
      isAuthenticated: true,
      user: { name: "Phụ Huynh", email: "ph@demo.com" },
      activeRole: "PARENT",
      activeUnifiedRole: null,
      roles: [],
    };
  });

  it("không hiện số dư xu", () => {
    render(<Header />);
    expect(document.querySelector('a[href="/coins"]')).toBeNull();
  });

  it("nút chính là 'Con của tôi' -> /home, không có 'Khóa học của tôi'", () => {
    render(<Header />);
    const link = screen.getAllByRole("link", { name: "Con của tôi" })[0];
    expect(link.getAttribute("href")).toBe("/home");
    expect(screen.queryByText("Khóa học của tôi")).toBeNull();
  });

  it("học viên vẫn thấy xu và 'Khóa học của tôi'", () => {
    authState.activeRole = "STUDENT";
    render(<Header />);
    expect(document.querySelector('a[href="/coins"]')).not.toBeNull();
    expect(screen.getAllByRole("link", { name: "Khóa học của tôi" })[0].getAttribute("href")).toBe("/my-courses");
  });
});