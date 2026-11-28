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
  user: { id?: string; name: string; email: string } | null;
  activeRole: string | null;
  activeUnifiedRole: null;
  roles: never[];
  sessionStatus?: "checking" | "authenticated" | "anonymous";
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
let notificationsState: { data?: unknown; isLoading?: boolean; isError?: boolean; refetch?: () => void } = { data: undefined };
vi.mock("@/hooks/queries/use-notifications", () => ({
  useNotifications: () => notificationsState,
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

beforeEach(() => {
  notificationsState = { data: undefined };
});

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

  it("Q4-T21: huy hiệu vai giảng viên ghi 'Giảng viên', không phải 'Giáo viên'", () => {
    authState.activeRole = "TEACHER";
    authState.activeUnifiedRole = { id: "sr-teacher", type: "system", role_name: "TEACHER" } as never;
    authState.roles = [
      { id: "sr-teacher", type: "system", role_name: "TEACHER", display_name: "TEACHER" },
      { id: "sr-student", type: "system", role_name: "STUDENT", display_name: "STUDENT" },
    ] as never;
    render(<Header />);
    openMenu();
    expect(screen.getAllByText("Giảng viên").length).toBeGreaterThan(0);
    expect(screen.queryByText("Giáo viên")).toBeNull();
  });

  // Q5-T13: trang hồ sơ giảng viên có rồi nhưng menu tài khoản không có lối vào.
  it("Q5-T13: giảng viên thấy 'Hồ sơ giảng viên' trỏ /profile/<id>; học viên thì không", () => {
    authState.user = { id: "t-77", name: "GV", email: "gv@demo.com" };
    authState.activeRole = "TEACHER";
    const { unmount } = render(<Header />);
    openMenu();
    expect(screen.getAllByRole("link", { name: "Hồ sơ giảng viên" })[0].getAttribute("href")).toBe("/profile/t-77");
    unmount();

    authState.activeRole = "STUDENT";
    render(<Header />);
    openMenu();
    expect(screen.queryByRole("link", { name: "Hồ sơ giảng viên" })).toBeNull();
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

  // Q6-PG-16: một vai thì danh sách chỉ có đúng vai đang dùng, hàng "Chuyển vai trò" vô nghĩa.
  it("Q6-PG-16: một vai -> không có hàng 'Chuyển vai trò'; từ hai vai -> có", () => {
    authState.activeRole = "PARENT";
    authState.activeUnifiedRole = { id: "sr-parent", type: "system", role_name: "PARENT" } as never;
    authState.roles = [{ id: "sr-parent", type: "system", role_name: "PARENT", display_name: "PARENT" }] as never;
    const { unmount } = render(<Header />);
    openMenu();
    expect(screen.queryByText("Chuyển vai trò")).toBeNull();
    unmount();

    authState.roles = [
      { id: "sr-parent", type: "system", role_name: "PARENT", display_name: "PARENT" },
      { id: "sr-student", type: "system", role_name: "STUDENT", display_name: "STUDENT" },
    ] as never;
    render(<Header />);
    openMenu();
    expect(screen.getByText("Chuyển vai trò")).toBeTruthy();
  });

  // Q6-PG-03: ở 768–900px cột 1fr của logo co về 0 và pill search che logo + tên thương hiệu.
  it("Q6-PG-03: dưới lg cột logo là auto (không co về 0); từ lg mới là lưới đối xứng 1fr/600/1fr", () => {
    const { container } = render(<Header />);
    const grid = container.querySelector("header > div") as HTMLElement;
    expect(grid.className).toContain("grid-cols-[auto_minmax(0,1fr)_auto]");
    expect(grid.className).toContain("lg:grid-cols-[1fr_minmax(0,600px)_1fr]");
    expect(grid.className).not.toMatch(/(^|\s)grid-cols-\[1fr_/);
    expect((grid.firstElementChild as HTMLElement).className).not.toContain("min-w-0");
  });

  // Q6-PG-06: chuông mở lúc danh sách còn đang tải nói "Không có thông báo nào" trong khi tiêu đề báo "N mới".
  describe("chuông thông báo", () => {
    const openBell = () => fireEvent.click(screen.getByRole("button", { name: /^Thông báo/ }));

    it("đang tải: khung chờ, không có câu 'Không có thông báo nào'", () => {
      unreadCountData = { unread_count: 3 };
      notificationsState = { data: undefined, isLoading: true };
      render(<Header />);
      openBell();
      expect(screen.getByRole("status", { name: "Đang tải thông báo" })).toBeTruthy();
      expect(screen.queryByText("Không có thông báo nào")).toBeNull();
    });

    it("lỗi: báo không tải được và có nút Thử lại gọi refetch", () => {
      const refetch = vi.fn();
      notificationsState = { data: undefined, isError: true, refetch };
      render(<Header />);
      openBell();
      expect(screen.queryByText("Không có thông báo nào")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    // Q11 #149 M2: refetch lỗi khi còn thông báo cache -> giữ danh sách và báo chưa làm mới được, có Thử lại.
    it("còn thông báo cache mà refetch lỗi: giữ danh sách, hiện thông báo cũ và Thử lại gọi refetch", () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      unreadCountData = { unread_count: 1 };
      notificationsState = {
        data: { notifications: [{ id: "n1", title: "Bài nộp đã chấm", is_read: false, created_at: new Date().toISOString() }] },
        isError: true,
        refetch,
      };
      render(<Header />);
      openBell();
      expect(screen.getByText("Bài nộp đã chấm")).toBeTruthy();
      expect(screen.getByText(/Không làm mới được thông báo/)).toBeTruthy();
      expect(screen.queryByText("Không tải được thông báo")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: /Thử lại/ }));
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("còn thông báo cache và không lỗi: không có thông báo cũ", () => {
      unreadCountData = { unread_count: 1 };
      notificationsState = {
        data: { notifications: [{ id: "n1", title: "Bài nộp đã chấm", is_read: false, created_at: new Date().toISOString() }] },
      };
      render(<Header />);
      openBell();
      expect(screen.getByText("Bài nộp đã chấm")).toBeTruthy();
      expect(screen.queryByText(/Không làm mới được thông báo/)).toBeNull();
    });

    it("tải xong và rỗng: 'Không có thông báo nào'", () => {
      unreadCountData = { unread_count: 0 };
      notificationsState = { data: { notifications: [] } };
      render(<Header />);
      openBell();
      expect(screen.getByText("Không có thông báo nào")).toBeTruthy();
    });
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

  // QA-B-20: giảng viên từng thấy chip xu "0" của học viên trên mọi trang.
  it("giảng viên không hiện số dư xu", () => {
    authState.activeRole = "TEACHER";
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

// UX-A-02: người đã đăng nhập mở trang công khai từng thấy "Đăng nhập · Đăng ký" 1,5–4s đầu.
describe("Header — lúc còn kiểm phiên", () => {
  beforeEach(() => {
    authState = {
      isAuthenticated: false,
      user: null,
      activeRole: null,
      activeUnifiedRole: null,
      roles: [],
      sessionStatus: "checking",
    };
  });

  it("không hiện nút Đăng nhập / Đăng ký, hiện trạng thái đang kiểm", () => {
    render(<Header />);
    expect(screen.queryByRole("button", { name: "Đăng nhập" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Đăng ký" })).toBeNull();
    expect(screen.getByRole("status", { name: "Đang kiểm tra đăng nhập" })).toBeTruthy();
  });

  it("menu mobile cũng không mời đăng nhập khi phiên chưa rõ", () => {
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(screen.getByText("Đang kiểm tra đăng nhập…")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Đăng nhập" })).toBeNull();
  });

  it("phiên đã kết luận là khách: hiện lại nút Đăng nhập", () => {
    authState.sessionStatus = "anonymous";
    render(<Header />);
    expect(screen.getAllByRole("button", { name: "Đăng nhập" }).length).toBeGreaterThan(0);
  });
});

// G-07 (QA3 261104): chuông thông báo trên header desktop hiện "Không có thông báo nào" cho khách như thể họ có hộp thư trống.
describe("Header — chuông thông báo desktop", () => {
  const bell = () => screen.queryByRole("button", { name: /^Thông báo/ });

  it("khách: không có chuông", () => {
    authState = { isAuthenticated: false, user: null, activeRole: null, activeUnifiedRole: null, roles: [] };
    render(<Header />);
    expect(bell()).toBeNull();
  });

  it("đã đăng nhập: có chuông", () => {
    authState = {
      isAuthenticated: true,
      user: { name: "Học Viên", email: "hv@demo.com" },
      activeRole: "STUDENT",
      activeUnifiedRole: null,
      roles: [],
    };
    render(<Header />);
    expect(bell()).not.toBeNull();
  });
});

