/**
 * E2E — các trang công khai phải xem được khi CHƯA đăng nhập.
 *
 * Bối cảnh (xác minh 2026-07-30): src/middleware.ts KHÔNG chặn gì — luôn
 * `NextResponse.next()`; `PUBLIC_ROUTES` chỉ là early-return vô nghĩa.
 * Gate thật là <RoleGuard> trong src/app/(app)/layout.tsx.
 * => Group (main) — "/", "/courses", "/discussions" — không có guard nên public.
 *
 * Test này là hàng rào cho SEO: nếu ai đó thêm guard vào (main), Google sẽ
 * không crawl được trang khóa học nữa và test sẽ fail.
 */

import { expect, test } from "@playwright/test";

const PUBLIC_PATHS = ["/", "/courses", "/discussions"];

for (const path of PUBLIC_PATHS) {
  test(`${path} xem được khi chưa đăng nhập`, async ({ page }) => {
    await page.goto(path);

    // Không bị đẩy về login/role-selection
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/\/register/);

    // Trang render thật, không phải màn trắng
    await expect(page.locator("body")).not.toBeEmpty();
  });
}

test("trang được bảo vệ thì KHÔNG lộ nội dung khi chưa đăng nhập", async ({
  page,
}) => {
  await page.goto("/settings");

  // (app) group có RoleGuard — hoặc redirect, hoặc render rỗng.
  // Điều không được xảy ra: hiện nội dung settings thật.
  await expect(page.locator("body")).not.toContainText("Đổi mật khẩu");
});
