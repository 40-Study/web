/**
 * QA8-A10: axe báo tương phản dưới 4.5 ở các trang admin: chữ gray-400 12px trên nền trắng (2.53:1), chữ trắng trên
 * green-600 (3.29:1), huy hiệu "Đang tắt" gray-500 trên gray-100 (4.39:1) và mã vai trò muted-foreground trên muted
 * (4.28:1). jsdom không tính được tương phản nên chốt bằng quét mã nguồn trang admin: chữ nhạt chỉ được dùng trong
 * cặp `dark:` (chế độ tối), nút Duyệt dùng green-700 và tiêu đề thẻ là h2 (thứ tự heading không nhảy từ h1 sang h3).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "..", "..", "..");
const ROOTS = [join(SRC, "app", "(admin)"), join(SRC, "components", "admin")];

function listSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listSources(full);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });
}
const files = ROOTS.flatMap(listSources).map((f) => ({ path: relative(SRC, f), text: readFileSync(f, "utf8") }));

function offenders(pattern: RegExp, allow?: (path: string) => boolean): string[] {
  return files.filter((f) => !allow?.(f.path) && pattern.test(f.text)).map((f) => f.path);
}

describe("admin pages — QA8-A10 tương phản và thứ tự heading", () => {
  it("không còn chữ text-gray-400 trần (trên nền sáng) — dùng gray-500 + dark:text-gray-400", () => {
    expect(offenders(/(?<![\w:-])text-gray-400/)).toEqual([]);
  });

  it("nút Duyệt dùng green-700 (trắng trên green-600 chỉ 3.29:1)", () => {
    expect(offenders(/bg-green-600/)).toEqual([]);
  });

  it("huy hiệu 'Đang tắt' và mã vai trò đủ đậm", () => {
    const vouchers = files.find((f) => f.path.endsWith("admin/vouchers/page.tsx"))?.text ?? "";
    expect(vouchers).toContain('disabled: "bg-gray-100 text-gray-700"');
    const roles = files.find((f) => f.path.endsWith("admin/roles/page.tsx"))?.text ?? "";
    expect(roles).not.toMatch(/bg-muted[^"]*text-muted-foreground/);
  });

  it("QA8-L2: huy hiệu 'Đã ẩn' ở danh mục và chip menu mobile cũng đủ đậm (cùng cặp 4.4:1 với A10)", () => {
    const categories = files.find((f) => f.path.endsWith("admin/categories/page.tsx"))?.text ?? "";
    expect(categories).not.toMatch(/bg-gray-100[^"]*text-gray-500/);
    const nav = files.find((f) => f.path.endsWith("components/admin/admin-mobile-nav.tsx"))?.text ?? "";
    expect(nav).not.toMatch(/bg-muted[^"]*text-muted-foreground/);
  });

  it("tiêu đề thẻ ở dashboard, vai trò, danh mục, chi tiết người dùng là h2 (không nhảy h1 -> h3)", () => {
    for (const suffix of ["admin/page.tsx", "admin/roles/page.tsx", "admin/categories/page.tsx", "users/[id]/page.tsx"]) {
      const file = files.find((f) => f.path.endsWith(suffix));
      expect(file, suffix).toBeDefined();
      expect(file?.text, suffix).not.toMatch(/<h3[\s>]/);
    }
  });
});
