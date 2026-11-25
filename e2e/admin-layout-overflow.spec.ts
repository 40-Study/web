/**
 * E2E đo bố cục khu admin ở 1280 và 390 (QA6-A01..A04). jsdom không dàn trang nên test đơn vị không bắt được tràn
 * ngang hay form nằm ngoài khung nhìn: lần QA5-A03 từng "sửa" bằng test ghim tên lớp CSS và vẫn tràn 683px.
 *
 * Dữ liệu dài được chèn vào RESPONSE GET của đúng trang (page.route) nên không ghi gì vào DB.
 * Chỉ chạy khi có env (không hardcode credential): E2E_PASSWORD, E2E_ADMIN_EMAIL (tài khoản có vai trò Quản trị hệ thống).
 * Backend đưa vào qua BACKEND_URL của dev server như e2e/contests.spec.ts.
 */

import { expect, test, type Browser, type Page } from "@playwright/test";

const PASSWORD = process.env.E2E_PASSWORD;
const ADMIN = process.env.E2E_ADMIN_EMAIL;

test.skip(!PASSWORD || !ADMIN, "Cần E2E_PASSWORD + E2E_ADMIN_EMAIL để đo bố cục admin");

const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;

async function loginAsSystemAdmin(browser: Browser, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport, locale: "vi-VN" });
  const page = await context.newPage();
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(ADMIN!);
  await page.locator('input[type="password"]').fill(PASSWORD!);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 30_000 });
  // Tài khoản nhiều vai trò dừng ở bước chọn vai trò: chọn Quản trị hệ thống.
  if (page.url().includes("/login/role")) {
    await page.getByText("Quản lý toàn bộ hệ thống").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();
  }
  await expect(page).toHaveURL(/\/admin/, { timeout: 30_000 });
  return { context, page };
}

/** Chèn dữ liệu vào response GET của API khớp `pattern`; request khác đi thẳng. */
async function injectIntoGet(page: Page, pattern: RegExp, mutate: (body: Record<string, any>) => void) {
  await page.route(pattern, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    const body = await response.json();
    mutate(body);
    await route.fulfill({ response, json: body });
  });
}

/** Dòng nhật ký tổng hợp cho trường hợp DB trống: chỉ tồn tại trong response bị chèn, không ghi gì vào DB. */
const syntheticAuditRow = () => ({
  id: "zz-audit", created_at: "2026-11-20T00:00:00Z", actor: null, action: "organization.update", target_type: "organization",
  target_id: "zz-org", status_code: 200, ip: "203.0.113.7", metadata: null,
});

const horizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Cuộn mượt mất vài trăm ms nên thăm dò tới khi form nằm trọn trong khung nhìn. */
async function expectInViewport(page: Page, selector: string) {
  await expect
    .poll(
      () =>
        page.locator(selector).evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= window.innerHeight;
        }),
      { message: `${selector} phải nằm trọn trong khung nhìn sau khi bấm Sửa`, timeout: 5_000 }
    )
    .toBe(true);
}

for (const viewport of WIDTHS) {
  test.describe(`admin ${viewport.width}px`, () => {
    let page: Page;
    let close: (() => Promise<void>) | undefined;

    test.beforeAll(async ({ browser }) => {
      const session = await loginAsSystemAdmin(browser, viewport);
      page = session.page;
      close = () => session.context.close();
    });
    test.afterAll(async () => close?.());

    test("A02 /admin/roles không tràn ngang khi danh sách người dùng có email dài", async () => {
      // QA7 #134 L-6: luôn có một dòng để đo. Vai trò chưa có người dùng thì chèn một dòng tổng hợp (chỉ ở response GET).
      const longEmail = `${"qa6-guest-".repeat(6)}@example.com`;
      await injectIntoGet(page, /\/api\/system-roles\/[^/]+\/users(\?.*)?$/, (body) => {
        const rows = body.data.user_system_roles;
        if (rows.length === 0) {
          rows.push({
            id: "zz-row", user_id: "zz-user", system_role_id: "zz-role", status: "active", granted_at: "2026-11-20T00:00:00Z",
            created_at: "2026-11-20T00:00:00Z", updated_at: "2026-11-20T00:00:00Z",
            user: { id: "zz-user", user_name: "zz", email: longEmail },
          });
          body.data.total = Math.max(1, body.data.total ?? 0);
        } else {
          rows[0].user = { ...rows[0].user, email: longEmail };
        }
      });
      await page.goto("/admin/roles");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(longEmail).first()).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });

    test("A03 /admin/categories: tên 64 và mô tả 120 ký tự liền không tràn; Sửa ở hàng cuối đưa form vào khung nhìn", async () => {
      await injectIntoGet(page, /\/api\/categories(\?.*)?$/, (body) => {
        body.data.categories.push({
          id: "zz-long", name: "N".repeat(64), slug: "zz-long", description: "d".repeat(120), is_active: true, created_at: "2026-11-20T00:00:00Z",
        });
      });
      await page.goto("/admin/categories");
      await page.waitForLoadState("networkidle");
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      await page.getByRole("button", { name: "Sửa", exact: true }).last().click();
      await expect(page.getByLabel("Tên danh mục")).toBeFocused();
      await expectInViewport(page, 'form:has(h2:text("Cập nhật danh mục"))');
    });

    test("A04 /admin/organizations: tên 100 ký tự, mô tả 500 ký tự và hộp xoá không tràn", async () => {
      const longName = "Đ".repeat(100);
      await injectIntoGet(page, /\/api\/organizations(\?.*)?$/, (body) => {
        body.data.organizations.unshift({
          id: "zz-org", name: longName, description: "x".repeat(500), status: "active", created_at: "2026-11-20T00:00:00Z", updated_at: "2026-11-20T00:00:00Z",
        });
      });
      await page.route(/\/api\/organizations\/zz-org\/members(\?.*)?$/, (route) =>
        route.fulfill({ json: { message: "ok", data: { user_organization_roles: [], total: 0 } } })
      );
      await page.goto("/admin/organizations");
      await page.waitForLoadState("networkidle");
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      await page.getByRole("button", { name: new RegExp(`^${longName}`) }).first().click();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      await page.getByRole("button", { name: "Xoá", exact: true }).first().click();
      const fits = await page.locator("[role=dialog] h2").evaluate((h) => h.scrollWidth <= h.clientWidth);
      expect(fits, "tiêu đề hộp xoá tràn khỏi hộp thoại").toBe(true);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });

    test("A04 dashboard: tên tổ chức dài trong 'Hoạt động gần đây' không tràn", async () => {
      // QA7 #134 L-6: nhật ký trống thì chèn một dòng tổng hợp (chỉ ở response GET) để phép đo luôn chạy.
      await injectIntoGet(page, /\/api\/admin\/audit-logs(\?.*)?$/, (body) => {
        if (body.data.items.length === 0) body.data.items.push(syntheticAuditRow());
        const item = body.data.items[0];
        item.target_type = "organization";
        item.metadata = { target_name: "Đ".repeat(100) };
      });
      await page.goto("/admin");
      await page.waitForLoadState("networkidle");
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });

    test("QA7-A05 /admin/audit-logs: đối tượng dài không đẩy các cột Kết quả/IP/Chi tiết ra khỏi khung nhìn", async () => {
      await injectIntoGet(page, /\/api\/admin\/audit-logs(\?.*)?$/, (body) => {
        if (body.data.items.length === 0) body.data.items.push(syntheticAuditRow());
        const item = body.data.items[0];
        item.target_type = "organization";
        item.metadata = { target_name: "Đ".repeat(100) };
      });
      await page.goto("/admin/audit-logs");
      await page.waitForLoadState("networkidle");
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      const outside = await page.locator("tbody tr").first().evaluate((tr) =>
        Array.from(tr.querySelectorAll("td")).filter((td) => td.getBoundingClientRect().right > window.innerWidth + 1).length
      );
      expect(outside, "mọi ô của dòng nhật ký phải nằm trong khung nhìn, không phải cuộn ngang trong bảng").toBe(0);
    });

    test("A01 /admin/permissions: Sửa mô tả ở quyền cuối đưa form vào khung nhìn và focus ô mô tả", async () => {
      await page.goto("/admin/permissions");
      await page.waitForLoadState("networkidle");
      const edit = page.getByRole("button", { name: "Sửa mô tả" }).last();
      await edit.scrollIntoViewIfNeeded();
      await edit.click();
      await expect(page.getByLabel("Mô tả quyền")).toBeFocused();
      await expectInViewport(page, 'form:has(h2:text("Sửa mô tả quyền"))');
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  });
}
