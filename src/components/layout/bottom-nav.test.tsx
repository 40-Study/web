/**
 * QA 260927 guest P1 — bottom-tab nav mobile cho khách chưa đăng nhập.
 *
 * Proves: bộ tab "guest" KHÔNG còn dẫn thẳng vào tường đăng nhập
 * (/home, /schedule, /leaderboard) — chỉ còn Trang chủ (/), Khóa học
 * (/courses), Đăng nhập (/login).
 *
 * Dự án chưa cài `@testing-library/jest-dom` (không có trong `vitest.setup.ts`),
 * nên đọc thẳng `.getAttribute("href")` thay vì matcher `toHaveAttribute()`.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BottomNav } from "./bottom-nav";
import { useAuthStore } from "@/stores/auth.store";
import { isRouteAllowedForRole, type NavRole } from "@/lib/routes";

// Badge lời mời đọc /friends/summary qua React Query; test này không dựng QueryClientProvider.
vi.mock("@/hooks/queries/use-friends", () => ({
  useFriendSummary: () => ({ data: { friends_count: 0, incoming_requests: 2, outgoing_requests: 0 } }),
}));

describe("BottomNav — bộ tab guest", () => {
  it("guest: chỉ Trang chủ(/), Khóa học(/courses), Đăng nhập(/login)", () => {
    render(<BottomNav role="guest" />);

    const home = screen.getByRole("link", { name: /Trang chủ/i });
    expect(home.getAttribute("href")).toBe("/");

    const courses = screen.getByRole("link", { name: /Khóa học/i });
    expect(courses.getAttribute("href")).toBe("/courses");

    const login = screen.getByRole("link", { name: /Đăng nhập/i });
    expect(login.getAttribute("href")).toBe("/login");

    // Không còn mục nào dẫn tới route yêu cầu đăng nhập
    expect(screen.queryByText("Lịch học")).toBeNull();
    expect(screen.queryByText("Xếp hạng")).toBeNull();
  });

  it("student: Trang chủ trỏ /home (không phải /), có Bạn bè -> /friends kèm badge lời mời", () => {
    useAuthStore.setState({ activeRole: "STUDENT" });
    render(<BottomNav role="student" />);

    const home = screen.getByRole("link", { name: /Trang chủ/i });
    expect(home.getAttribute("href")).toBe("/home");
    expect(screen.getByText("Xếp hạng")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Bạn bè/ }).getAttribute("href")).toBe("/friends");
    expect(screen.getByRole("status", { name: "2 lời mời kết bạn mới" })).toBeTruthy();
  });

  // A-08: tab Live dẫn tới danh sách buổi livestream; chỉ có ở bộ tab học viên.
  it("student: có tab Live -> /livestream; các vai khác không có", () => {
    useAuthStore.setState({ activeRole: "STUDENT" });
    const { unmount } = render(<BottomNav role="student" />);
    expect(screen.getByRole("link", { name: /Live/ }).getAttribute("href")).toBe("/livestream");
    unmount();

    for (const role of ["parent", "teacher", "guest", "admin"] as const) {
      const r = render(<BottomNav role={role} />);
      expect(screen.queryByText("Live")).toBeNull();
      r.unmount();
    }
    useAuthStore.setState({ activeRole: null });
  });

  it("chỉ student có Bạn bè: parent, teacher, guest, admin không có", () => {
    for (const role of ["parent", "teacher", "guest", "admin"] as const) {
      const { unmount } = render(<BottomNav role={role} />);
      expect(screen.queryByText("Bạn bè")).toBeNull();
      unmount();
    }
  });

  it("tab student nhưng vai thật là TEACHER: ẩn Bạn bè (không phụ thuộc prop role)", () => {
    useAuthStore.setState({ activeRole: "TEACHER" });
    render(<BottomNav role="student" />);
    expect(screen.queryByText("Bạn bè")).toBeNull();
    expect(screen.getByText("Xếp hạng")).toBeTruthy();
    useAuthStore.setState({ activeRole: null });
  });

  it("parent: nhãn Con của tôi trỏ /settings/family", () => {
    render(<BottomNav role="parent" />);

    const family = screen.getByRole("link", { name: /Con của tôi/i });
    expect(family.getAttribute("href")).toBe("/settings/family");
  });
});

/**
 * Review PR #26 MAJOR #1: menu ẩn nhưng route vẫn mở là lỗi CHÍNH. Test này
 * duyệt từng tab thật sự render cho từng role và khẳng định
 * `isRouteAllowedForRole` (cùng bảng `ROLE_SCOPED_ROUTES` route guard ở
 * `(app)/layout.tsx` đọc) không bao giờ từ chối một route mà menu đang hiển
 * thị — nếu ai thêm tab mới vào `navConfigs` mà quên thêm entry tương ứng vào
 * `ROLE_SCOPED_ROUTES`, test này đỏ ngay (route sẽ bị "không nằm trong bảng"
 * -> mặc định cho qua -> không phát hiện được lệch NGƯỢC hướng, nhưng lệch
 * đúng hướng nguy hiểm — menu hiện mà route chặn — luôn bị bắt).
 */
describe("BottomNav x isRouteAllowedForRole — menu hiển thị route nào thì route đó phải cho vai trò này vào", () => {
  const ROLE_TO_NAV_ROLE: Record<"student" | "parent" | "guest" | "admin", NavRole> = {
    student: "STUDENT",
    parent: "PARENT",
    guest: "GUEST",
    admin: "ADMIN",
  };

  for (const [bottomNavRole, navRole] of Object.entries(ROLE_TO_NAV_ROLE) as [
    keyof typeof ROLE_TO_NAV_ROLE,
    NavRole,
  ][]) {
    it(`role="${bottomNavRole}" — mọi tab hiển thị đều isRouteAllowedForRole(_, "${navRole}") === true`, () => {
      render(<BottomNav role={bottomNavRole} />);
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);

      for (const link of links) {
        const href = link.getAttribute("href");
        expect(href).toBeTruthy();
        expect(isRouteAllowedForRole(href!, navRole)).toBe(true);
      }
    });
  }
});
