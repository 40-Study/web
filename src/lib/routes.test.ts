/**
 * Review PR #26 MAJOR #1 — `ROLE_SCOPED_ROUTES`/`isRouteAllowedForRole` là
 * NGUỒN DUY NHẤT quyết định cả menu (sidebar.tsx/bottom-nav.tsx) lẫn route
 * guard (`(app)/layout.tsx`). Test này duyệt "mỗi role x mỗi route cấu hình"
 * y như coordinator yêu cầu — cả chiều cho phép LẪN chiều từ chối, để không
 * ai âm thầm thêm route vào bảng mà quên chiều còn lại.
 */

import { describe, expect, it } from "vitest";
import { ROLE_SCOPED_ROUTES, isRouteAllowedForRole, type NavRole } from "./routes";

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

  it("/settings/family và /messages cho cả STUDENT lẫn PARENT (không phải route học sinh-only)", () => {
    expect(isRouteAllowedForRole("/settings/family", "STUDENT")).toBe(true);
    expect(isRouteAllowedForRole("/settings/family", "PARENT")).toBe(true);
    expect(isRouteAllowedForRole("/messages", "STUDENT")).toBe(true);
    expect(isRouteAllowedForRole("/messages", "PARENT")).toBe(true);
  });
});
