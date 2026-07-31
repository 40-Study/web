/**
 * E2E cho phase 04 + 05: trang tra cứu chứng chỉ công khai và các file SEO.
 *
 * Chạy được KHÔNG cần backend: trang form là tĩnh, còn trang kết quả xử lý
 * được trường hợp backend chết (verifyCertificateServer trả null -> "không
 * tìm thấy"). Chính điều đó là thứ cần test.
 */

import { expect, test } from "@playwright/test";

test.describe("tra cứu chứng chỉ (công khai)", () => {
  test("form tra cứu mở được khi chưa đăng nhập", async ({ page }) => {
    const res = await page.goto("/certificates/verify");

    expect(res?.status()).toBeLessThan(400);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByLabel("Mã chứng chỉ")).toBeVisible();
  });

  test("nhập mã rồi tra cứu thì chuyển sang trang kết quả", async ({ page }) => {
    await page.goto("/certificates/verify");

    await page.getByLabel("Mã chứng chỉ").fill("CERT-KHONG-TON-TAI");
    await page.getByRole("button", { name: "Tra cứu" }).click();

    await expect(page).toHaveURL(/\/certificates\/verify\/CERT-KHONG-TON-TAI/);
  });

  test("mã không hợp lệ -> báo không tìm thấy, KHÔNG lộ dữ liệu ai", async ({
    page,
  }) => {
    await page.goto("/certificates/verify/CERT-KHONG-TON-TAI");

    await expect(page.getByText(/Không tìm thấy chứng chỉ/)).toBeVisible();
    await expect(page.getByText(/Chứng chỉ hợp lệ/)).toHaveCount(0);
    // Không bị đẩy về login — đây là trang công khai
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("file SEO", () => {
  test("/robots.txt chặn khu vực riêng tư, trỏ tới sitemap", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body).toContain("Sitemap:");
    expect(body).toContain("/api/");
    expect(body).toContain("/admin");
    expect(body).toContain("/certificates/verify/");
  });

  test("/sitemap.xml hợp lệ và KHÔNG chứa route cần đăng nhập", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);

    const xml = await res.text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain("/courses");

    // Rò rỉ route private vào sitemap là lỗi SEO + lộ cấu trúc nội bộ
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("/teacher");
    expect(xml).not.toContain("/my-attendance");
    expect(xml).not.toContain("/login");
  });

  test("/manifest.webmanifest cài được lên màn hình chính", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);

    const m = await res.json();
    expect(m.name).toBeTruthy();
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });
});
