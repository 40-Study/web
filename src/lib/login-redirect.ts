/**
 * URL trang đăng nhập kèm `?redirect=` để quay lại trang cũ — dùng bởi `middleware.ts`.
 *
 * Tách khỏi middleware để test được lớp phòng thủ thứ hai (review m7): `NextRequest` đã chuẩn
 * hoá đường dẫn nên qua middleware không dựng lại được giá trị nguy hiểm, và test cũ vẫn xanh khi
 * lỡ bỏ `sanitizeRedirect`. Trang login cũng sanitize khi đọc (lớp thứ nhất); ở đây không bao giờ
 * PHÁT RA một `redirect` trỏ sang host khác, kể cả khi đường dẫn đến từ nguồn chưa chuẩn hoá.
 */
import { sanitizeRedirect } from "@/lib/safe-redirect";

export function buildLoginRedirectUrl(pathname: string, search: string, base: string | URL): URL {
  const loginUrl = new URL("/login", base);
  const redirectTo = sanitizeRedirect(`${pathname}${search}`);
  if (redirectTo) loginUrl.searchParams.set("redirect", redirectTo);
  return loginUrl;
}
