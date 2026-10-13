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
let unreadCountData: { unread_count: number } | undefined;
vi.mock("@/hooks/queries/use-notifications", () => ({
  useNotifications: () => ({ data: undefined }),
  useUnreadCount: () => ({ data: unreadCountData }),
  useMarkNotificationRead: () => ({ mutate: vi.fn() }),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/use-notification-socket", () => ({ useNotificationSocket: () => undefined }));
vi.mock("@/components/layout/global-search", () => ({ GlobalSearch: () => null }));
vi.mock("@/components/layout/cart-dropdown", () => ({ CartDropdown: () => null }));
vi.mock("@/components/auth/auth-modal", () => ({ AuthModal: () => null }));

// eslint-disable-next-line import/first
import { Header } from "./header";
// eslint-disable-next-line import/first
import { useCartStore } from "@/stores/cart.store";

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

  // QA2 F-10: wishlist có trang riêng nhưng không có đường vào từ menu.
  it("học viên thấy 'Khoá học yêu thích' trỏ /wishlist; giảng viên và phụ huynh thì không", () => {
    render(<Header />);
    openMenu();
    expect(screen.getAllByRole("link", { name: /Khoá học yêu thích/ })[0].getAttribute("href")).toBe("/wishlist");
  });

  it.each(["TEACHER", "PARENT"])("%s KHÔNG thấy 'Khoá học yêu thích' (route chỉ dành cho học viên)", (role) => {
    authState.activeRole = role;
    render(<Header />);
    openMenu();
    expect(screen.queryByRole("link", { name: /Khoá học yêu thích/ })).toBeNull();
  });

  it("logo dùng siteConfig.name", () => {
    render(<Header />);
    expect(screen.getAllByText(siteConfig.name).length).toBeGreaterThan(0);
  });
});

// Lane U (UX-5): phụ huynh không học -> không hiện xu, nút chính trỏ về nơi có tổng quan các con
// (/home) thay vì "Khoá học của tôi" (/my-courses, route chỉ dành cho học viên).
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

  it("nút chính là 'Con của tôi' -> /home, không có 'Khoá học của tôi'", () => {
    render(<Header />);
    const link = screen.getAllByRole("link", { name: "Con của tôi" })[0];
    expect(link.getAttribute("href")).toBe("/home");
    expect(screen.queryByText("Khoá học của tôi")).toBeNull();
  });

  // L4: chip xu dùng cùng điều kiện với useCoinWallet — vai không có ví thì không hiện "0" giả.
  it("quản trị viên cũng không hiện số dư xu (không có ví, /coins sẽ bị chuyển hướng)", () => {
    authState.activeRole = "SYSTEM_ADMIN";
    render(<Header />);
    expect(document.querySelector('a[href="/coins"]')).toBeNull();
  });

  it("học viên vẫn thấy xu và 'Khoá học của tôi'", () => {
    authState.activeRole = "STUDENT";
    render(<Header />);
    expect(document.querySelector('a[href="/coins"]')).not.toBeNull();
    expect(screen.getAllByRole("link", { name: "Khoá học của tôi" })[0].getAttribute("href")).toBe("/my-courses");
  });
});

// QA vòng 2 (F-04): ở 390px header chỉ còn logo + hamburger; chuông, giỏ hàng (md:) bị ẩn và bottom-nav
// không có chỗ cho chúng nên học viên không có lối vào giỏ hàng / thông báo / tin nhắn trên mobile.
describe("Header — hamburger mobile có lối vào giỏ hàng, thông báo, tin nhắn", () => {
  beforeEach(() => {
    authState = {
      isAuthenticated: true,
      user: { name: "Học Viên", email: "hv@demo.com" },
      activeRole: "STUDENT",
      activeUnifiedRole: null,
      roles: [],
    };
    unreadCountData = { unread_count: 3 };
    useCartStore.setState({ items: [], total: 0, total_item: 2 });
  });

  function openMobileMenu() {
    fireEvent.click(screen.getByRole("button", { name: "Mở menu" }));
    return screen.getByRole("button", { name: "Đóng menu" }).parentElement as HTMLElement;
  }

  function hrefOf(menu: HTMLElement, name: RegExp) {
    return Array.from(menu.querySelectorAll("a"))
      .find((a) => name.test(a.textContent ?? ""))
      ?.getAttribute("href");
  }

  it("học viên: Giỏ hàng -> /cart kèm số lượng, Thông báo -> /notifications kèm số chưa đọc, Tin nhắn -> /messages", () => {
    render(<Header />);
    const menu = openMobileMenu();

    expect(hrefOf(menu, /Giỏ hàng/)).toBe("/cart");
    expect(menu.textContent).toContain("Giỏ hàng");
    expect(screen.getByLabelText("2 khoá học trong giỏ")).toBeTruthy();
    expect(hrefOf(menu, /Thông báo/)).toBe("/notifications");
    expect(screen.getByLabelText("3 thông báo chưa đọc")).toBeTruthy();
    expect(hrefOf(menu, /Tin nhắn/)).toBe("/messages");
  });

  it("giỏ trống / không có thông báo mới: không hiện chấm số", () => {
    useCartStore.setState({ total_item: 0 });
    unreadCountData = { unread_count: 0 };
    render(<Header />);
    openMobileMenu();

    expect(screen.queryByLabelText(/khoá học trong giỏ/)).toBeNull();
    expect(screen.queryByLabelText(/thông báo chưa đọc/)).toBeNull();
  });

  it("giảng viên và phụ huynh: có Thông báo + Tin nhắn nhưng KHÔNG có Giỏ hàng (chỉ học viên mua khoá)", () => {
    for (const role of ["TEACHER", "PARENT"]) {
      authState.activeRole = role;
      const { unmount } = render(<Header />);
      const menu = openMobileMenu();

      expect(hrefOf(menu, /Thông báo/)).toBe("/notifications");
      expect(hrefOf(menu, /Tin nhắn/)).toBe("/messages");
      expect(hrefOf(menu, /Giỏ hàng/)).toBeUndefined();
      unmount();
    }
  });

  it("khách chưa đăng nhập: menu chỉ có Đăng nhập / Đăng ký", () => {
    authState.isAuthenticated = false;
    render(<Header />);
    const menu = openMobileMenu();

    expect(menu.textContent).not.toContain("Giỏ hàng");
    expect(menu.textContent).not.toContain("Thông báo");
    expect(menu.textContent).not.toContain("Tin nhắn");
  });
});
