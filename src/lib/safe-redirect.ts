/**
 * Chặn open redirect qua `/login?redirect=` (review PR #33).
 *
 * TẠI SAO resolve bằng `new URL` thay vì chỉ kiểm tiền tố: Next chuẩn hoá dot-segment trước khi
 * điều hướng, nên `/.//evil.com`, `/%2e//evil.com`, `/./\evil.com` đều thành `//evil.com`, tức
 * URL không scheme trỏ sang host khác (re-review PR #33). Resolve theo một origin cố định rồi đòi
 * cùng origin và pathname sau chuẩn hoá không bắt đầu bằng `//` thì bắt được mọi biến thể đó.
 * Trả về đường dẫn ĐÃ chuẩn hoá (pathname + search + hash) để thứ được điều hướng chính là thứ
 * đã kiểm. Không hợp lệ thì trả `null` để nơi gọi dùng trang mặc định của vai trò.
 */

// Origin cố định (không đọc window): kết quả giống nhau ở client và SSR, và ta chỉ cần biết giá
// trị có ở lại CÙNG origin hay không, không cần origin thật.
const PROBE_ORIGIN = "http://redirect.invalid";

export function sanitizeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  // Khoảng trắng/ký tự điều khiển bị trình duyệt bỏ qua khi phân tích URL ("/\t/evil.com").
  if (/\s/.test(value) || Array.from(value).some((ch) => ch.charCodeAt(0) < 0x20 || ch.charCodeAt(0) === 0x7f)) {
    return null;
  }
  // Chỉ nhận đường dẫn tuyệt đối trong site; `//x` và `/\x` là URL sang host khác.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;

  let url: URL;
  try {
    url = new URL(value, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PROBE_ORIGIN) return null;
  // WHATWG đổi `\` thành `/` và rút gọn `.`/`..`/`%2e`: "/./\evil.com" -> pathname "//evil.com".
  if (url.pathname.startsWith("//")) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}
