/**
 * E2E — luồng đăng nhập.
 *
 * Selector bám theo src/app/(auth)/login/page.tsx: input[type=email],
 * input[type=password], button[type=submit].
 *
 * Test đăng nhập THẬT chỉ chạy khi có E2E_EMAIL + E2E_PASSWORD trong env.
 * Không hardcode credential — xem .env.example.
 */

import { expect, test } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

test.describe("trang đăng nhập", () => {
  test("render form với email, mật khẩu và nút submit", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("submit form rỗng thì không rời khỏi /login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('button[type="submit"]').click();

    // HTML validation hoặc validation phía client phải chặn lại
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("đăng nhập thật", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "Cần E2E_EMAIL + E2E_PASSWORD để chạy test này"
  );

  test("đăng nhập thành công thì rời khỏi /login", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[type="email"]').fill(EMAIL!);
    await page.locator('input[type="password"]').fill(PASSWORD!);
    await page.locator('button[type="submit"]').click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
