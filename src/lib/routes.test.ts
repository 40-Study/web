/**
 * Review PR #26 MAJOR #1 — `ROLE_SCOPED_ROUTES`/`isRouteAllowedForRole` là
 * NGUỒN DUY NHẤT quyết định cả menu (sidebar.tsx/bottom-nav.tsx) lẫn route
 * guard (`(app)/layout.tsx`). Test này duyệt "mỗi role x mỗi route cấu hình"
 * y như coordinator yêu cầu — cả chiều cho phép LẪN chiều từ chối, để không
 * ai âm thầm thêm route vào bảng mà quên chiều còn lại.
 */

import { describe, expect, it } from "vitest";
import {
  ROLE_SCOPED_PATTERNS,
  ROLE_SCOPED_ROUTES,
  canAccessStudentOnlyRoute,
  getRoleRestrictedRedirect,
  isRouteAllowedForRole,
  type NavRole,
} from "./routes";

const ALL_ROLES: NavRole[] = ["GUEST", "STUDENT", "PARENT", "ADMIN"];

describe("isRouteAllowedForRole — ma trận role x route (ROLE_SCOPED_ROUTES)", () => {
  for (const entry of ROLE_SCOPED_ROUTES) {
    for (const role of ALL_ROLES) {
      const expected = entry.roles.includes(role);
      it(`${entry.href} x ${role} -> ${expected ? "CHO PHÉP" : "TỪ CHỐI"}`, () => {
        expect(isRouteAllowedForRole(entry.href, role)).toBe(expected);
      });
    }
  }

  for (const entry of ROLE_SCOPED_PATTERNS) {
    for (const role of ALL_ROLES) {
      const expected = entry.roles.includes(role);
      it(`pattern ${entry.example} x ${role} -> ${expected ? "CHO PHÉP" : "TỪ CHỐI"}`, () => {
        expect(isRouteAllowedForRole(entry.example, role)).toBe(expected);
      });
    }
  }

  it("cuộc thi: phụ huynh xem danh sách + chi tiết, bị chặn làm bài/kết quả/chứng nhận", () => {
    expect(isRouteAllowedForRole("/contests", "PARENT")).toBe(true);
    expect(isRouteAllowedForRole("/contests/thi-git", "PARENT")).toBe(true);
    for (const sub of ["play", "result", "certificate"]) {
      expect(isRouteAllowedForRole(`/contests/thi-git/${sub}`, "PARENT")).toBe(false);
      expect(isRouteAllowedForRole(`/contests/thi-git/${sub}`, "STUDENT")).toBe(true);
    }
    // Slug trùng tên route con KHÔNG bị coi là route con (chỉ segment thứ 3 mới tính)
    expect(isRouteAllowedForRole("/contests/play", "PARENT")).toBe(true);
  });

  it("cuộc thi: phụ huynh bị chặn route con -> về trang chi tiết cuộc thi, không về /home", () => {
    expect(getRoleRestrictedRedirect("/contests/thi-git/play", "PARENT")).toBe("/contests/thi-git");
    expect(getRoleRestrictedRedirect("/contests/thi-git/certificate/", "PARENT")).toBe("/contests/thi-git");
    expect(getRoleRestrictedRedirect("/achievements", "PARENT")).toBe("/home");
  });

  it("route con (vd /achievements/detail) thừa hưởng quyền của route cha", () => {
    expect(isRouteAllowedForRole("/achievements/detail", "PARENT")).toBe(false);
    expect(isRouteAllowedForRole("/achievements/detail", "STUDENT")).toBe(true);
  });

  it("route không nằm trong bảng -> luôn cho qua ở tầng này (không bị hạn chế bởi cơ chế này)", () => {
    expect(isRouteAllowedForRole("/notifications", "PARENT")).toBe(true);
    expect(isRouteAllowedForRole("/checkout", "GUEST")).toBe(true);
  });

  it("/leaderboard bị ẩn với PARENT (coordinator: 'Ẩn luôn Bảng xếp hạng với phụ huynh') dù chưa từng có trong menu", () => {
    expect(isRouteAllowedForRole("/leaderboard", "PARENT")).toBe(false);
    expect(isRouteAllowedForRole("/leaderboard", "STUDENT")).toBe(true);
  });

  // Bỏ entry "/friends" khỏi ROLE_SCOPED_ROUTES làm test này ĐỎ (phụ huynh lại vào được).
  it("/friends: phụ huynh bị chặn và được đưa về /home, học viên vẫn vào", () => {
    expect(isRouteAllowedForRole("/friends", "PARENT")).toBe(false);
    expect(isRouteAllowedForRole("/friends", "STUDENT")).toBe(true);
    expect(getRoleRestrictedRedirect("/friends", "PARENT")).toBe("/home");
  });

  // Bỏ hai entry khỏi ROLE_SCOPED_ROUTES làm test này ĐỎ: menu của học viên mất mục và phụ huynh gõ URL vẫn vào được.
  it("/livestream và /my-grades: chỉ học viên, phụ huynh bị đưa về /home", () => {
    for (const href of ["/livestream", "/my-grades"]) {
      expect(isRouteAllowedForRole(href, "STUDENT")).toBe(true);
      expect(isRouteAllowedForRole(href, "PARENT")).toBe(false);
      expect(isRouteAllowedForRole(href, "GUEST")).toBe(false);
      expect(isRouteAllowedForRole(href, "ADMIN")).toBe(false);
      expect(getRoleRestrictedRedirect(href, "PARENT")).toBe("/home");
    }
  });

  // resolveNavRole quy TEACHER về STUDENT nên bảng NavRole không chặn được giáo viên; hàm theo vai THẬT chặn.
  it("canAccessStudentOnlyRoute: /livestream, /my-grades chỉ vai STUDENT thật; route khác không bị ảnh hưởng", () => {
    for (const href of ["/livestream", "/livestream/x", "/my-grades"]) {
      expect(canAccessStudentOnlyRoute(href, "STUDENT")).toBe(true);
      expect(canAccessStudentOnlyRoute(href, "TEACHER")).toBe(false);
      expect(canAccessStudentOnlyRoute(href, "PARENT")).toBe(false);
    }
    expect(canAccessStudentOnlyRoute("/my-grades-old", "TEACHER")).toBe(true);
    expect(canAccessStudentOnlyRoute("/messages", "TEACHER")).toBe(true);
    expect(canAccessStudentOnlyRoute("/schedule", "TEACHER")).toBe(true);
  });

  it("/settings/family và /messages cho cả STUDENT lẫn PARENT (không phải route học sinh-only)", () => {
    expect(isRouteAllowedForRole("/settings/family", "STUDENT")).toBe(true);
    expect(isRouteAllowedForRole("/settings/family", "PARENT")).toBe(true);
    expect(isRouteAllowedForRole("/messages", "STUDENT")).toBe(true);
    expect(isRouteAllowedForRole("/messages", "PARENT")).toBe(true);
  });
});
