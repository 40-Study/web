/**
 * Hằng số SEO dùng chung cho sitemap.ts, robots.ts và metadata các trang.
 * Tách riêng để sitemap và robots không lệch nhau (SSOT).
 */

/** Domain production; đổi qua env, fallback localhost cho dev */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

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
  "/teacher",
  "/parent",
  "/settings",
  "/messages",
  "/cart",
  "/checkout",
  "/my-courses",
  "/my-assignments",
  "/my-attendance",
  "/my-vouchers",
  "/certificates/verify/", // trang kết quả theo mã — dữ liệu cá nhân
  "/login",
  "/register",
  "/otp",
  "/forgot-password",
  "/reset-password",
  "/accept-invitation",
  "/403",
] as const;
