/**
 * Review PR #25 (BLOCKER #2): middleware thiếu "/certificates" trong
 * PROTECTED_ROUTE_PREFIXES khiến khách chưa đăng nhập vào /certificates bị
 * NextResponse.next() cho qua thẳng -> trang tự render rỗng (không có cookie
 * -> API 401) thay vì bị đá về /login.
 *
 * Test này KHÔNG chỉ thêm lại đúng 1 route đã biết — nó liệt kê MỌI
 * `page.tsx` thật trên filesystem dưới các route group cần đăng nhập
 * ((app),(teacher),(admin),(dashboard),(lesson),(live)) và assert middleware
 * coi TỪNG route đó là protected, để một route MỚI thêm sau này (không có
 * PROTECTED_ROUTE_PREFIXES tương ứng) tự động bị test này bắt lỗi thay vì
 * lặng lẽ lọt qua như /certificates đã từng.
 *
 * "/certificates/verify" (route group (main), public theo thiết kế — tra cứu
 * chứng chỉ không cần đăng nhập) PHẢI giữ nguyên là public, không bị cuốn vào
 * danh sách protected.
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

const APP_ROOT = path.resolve(import.meta.dirname, "app");

// Các route group THẬT SỰ cần đăng nhập theo chỉ đạo review — không phải
// MỌI route group (ví dụ (main),(auth) là public theo thiết kế).
const AUTH_REQUIRED_GROUPS = ["(app)", "(teacher)", "(admin)", "(dashboard)", "(lesson)", "(live)"];

/** Liệt kê đệ quy mọi `page.tsx` dưới một thư mục. */
function findPageFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findPageFiles(full));
    } else if (entry.isFile() && entry.name === "page.tsx") {
      results.push(full);
    }
  }
  return results;
}

/**
 * Chuyển đường dẫn file `page.tsx` thành URL thật — bỏ segment route group
 * `(group)`, thay `[param]` bằng 1 giá trị stub, `[...catchall]` bằng 1
 * segment stub (đủ để middleware match theo tiền tố, không cần khớp route
 * thật 100%).
 */
function fileToRoute(filePath: string): string {
  const rel = path
    .relative(APP_ROOT, filePath)
    .split(path.sep)
    .join("/")
    .replace(/\/page\.tsx$/, "");
  const segments = rel
    .split("/")
    .filter((seg) => !/^\(.+\)$/.test(seg))
    .map((seg) => {
      if (/^\[\.\.\..+\]$/.test(seg)) return "stub-catchall";
      if (/^\[.+\]$/.test(seg)) return "stub-id";
      return seg;
    });
  return `/${segments.join("/")}`;
}

function protectedRoutesFromGroup(group: string): string[] {
  const groupDir = path.join(APP_ROOT, group);
  return findPageFiles(groupDir).map(fileToRoute);
}

function isRedirectToLogin(response: Response): boolean {
  if (response.status !== 307 && response.status !== 308) return false;
  const location = response.headers.get("location") ?? "";
  return new URL(location).pathname === "/login";
}

describe("middleware — mọi page.tsx dưới route group cần đăng nhập phải bị chặn khi chưa có cookie", () => {
  const allProtectedRoutes = AUTH_REQUIRED_GROUPS.flatMap(protectedRoutesFromGroup);

  // Tự-kiểm: nếu filesystem thay đổi cấu trúc và không tìm thấy route nào
  // nữa, test dưới sẽ pass rỗng một cách giả tạo (0/0) — chặn ngay ở đây.
  it("tìm thấy ít nhất 1 page.tsx trong mỗi route group cần đăng nhập (tự-kiểm scan không rỗng)", () => {
    for (const group of AUTH_REQUIRED_GROUPS) {
      const routes = protectedRoutesFromGroup(group);
      expect(routes.length, `route group ${group} không có page.tsx nào — scan có thể đã sai đường dẫn`).toBeGreaterThan(0);
    }
  });

  it.each(allProtectedRoutes)("route %s (chưa có cookie) -> redirect về /login", (route) => {
    const request = new NextRequest(new URL(route, "http://localhost:3000"));
    const response = middleware(request);
    expect(isRedirectToLogin(response), `middleware KHÔNG chặn "${route}" — thiếu tiền tố tương ứng trong PROTECTED_ROUTE_PREFIXES (middleware.ts)`).toBe(true);
  });

  it("/certificates/verify (route group (main), tra cứu chứng chỉ) VẪN LÀ public, không bị cuốn theo /certificates protected", () => {
    const request = new NextRequest(new URL("/certificates/verify", "http://localhost:3000"));
    const response = middleware(request);
    expect(isRedirectToLogin(response)).toBe(false);
  });

  it("/certificates/verify/[number] (route group (main)) VẪN LÀ public", () => {
    const request = new NextRequest(new URL("/certificates/verify/CERT-001", "http://localhost:3000"));
    const response = middleware(request);
    expect(isRedirectToLogin(response)).toBe(false);
  });
});
