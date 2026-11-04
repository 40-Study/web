/**
 * Hằng số SEO dùng chung cho sitemap.ts, robots.ts và metadata các trang.
 * Tách riêng để sitemap và robots không lệch nhau (SSOT).
 */

const DEV_SITE_URL = "http://localhost:3000";

export const SITE_URL_REQUIRED_MESSAGE =
  "NEXT_PUBLIC_SITE_URL chưa được đặt. Bản build production cần domain thật (vd: https://example.com), " +
  "nếu không sitemap.xml, robots.txt, canonical và og:url trỏ về http://localhost:3000. " +
  "Đặt biến này trước `next build` (docker: --build-arg NEXT_PUBLIC_SITE_URL=...).";

/**
 * Chọn domain site (G-10, QA3 261104: thiếu env thì sitemap/robots ra toàn `http://localhost:3000` mà không báo gì).
 * - có giá trị -> dùng, bỏ dấu `/` cuối; giá trị không phải URL tuyệt đối -> ném lỗi.
 * - thiếu + build/chạy production -> NÉM LỖI (build hỏng ngay thay vì ship sitemap vô dụng).
 * - thiếu + dev -> localhost kèm cảnh báo console. Thiếu + test -> localhost, im lặng (test import module này gián tiếp).
 * Nhận tham số thay vì đọc `process.env` để test được; nơi gọi phải truyền `process.env.NEXT_PUBLIC_SITE_URL`
 * viết nguyên văn (Next chỉ nhúng biến NEXT_PUBLIC_ vào bundle client khi gặp đúng cú pháp đó).
 */
export function resolveSiteUrl(
  value: string | undefined,
  nodeEnv: string | undefined,
  warn: (message: string) => void = console.warn
): string {
  const configured = value?.trim();
  if (configured) {
    try {
      new URL(configured);
    } catch {
      throw new Error(`NEXT_PUBLIC_SITE_URL không phải URL hợp lệ: "${configured}"`);
    }
    return configured.replace(/\/$/, "");
  }
  if (nodeEnv === "production") throw new Error(SITE_URL_REQUIRED_MESSAGE);
  if (nodeEnv === "development") warn(`[seo] ${SITE_URL_REQUIRED_MESSAGE} Dev tạm dùng ${DEV_SITE_URL}.`);
  return DEV_SITE_URL;
}

/** Domain production, đặt qua env NEXT_PUBLIC_SITE_URL (bắt buộc ở bản build production, xem resolveSiteUrl). */
export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, process.env.NODE_ENV);

/**
 * Đường dẫn vừa CÔNG KHAI (không bị RoleGuard) vừa đáng index.
 *
 * Đã đối chiếu với cây route: group (main) không có guard, group (app) /
 * (teacher) / (admin) / (dashboard) có RoleGuard.
 * Thêm path mới vào đây thì phải chắc chắn nó nằm ngoài các group bị guard.
 */
export const PUBLIC_INDEXABLE_PATHS = [
  "/",
  "/courses",
  "/discussions",
  "/certificates/verify",
] as const;

/**
 * Tiền tố KHÔNG cho crawler đụng vào: cần đăng nhập, hoặc chứa dữ liệu cá nhân,
 * hoặc là API.
 */
export const DISALLOWED_PATH_PREFIXES = [
  "/api/",
  "/admin",
  "/org",
  "/teacher",
  "/parent",
  "/settings",
  "/messages",
  "/livestream",
  "/cart",
  "/checkout",
  "/my-courses",
  "/my-assignments",
  "/my-attendance",
  "/my-grades",
  "/my-vouchers",
  "/wishlist",
  "/certificates/verify/", // trang kết quả theo mã — dữ liệu cá nhân
  "/login",
  "/register",
  "/otp",
  "/forgot-password",
  "/reset-password",
  "/accept-invitation",
  "/403",
] as const;
