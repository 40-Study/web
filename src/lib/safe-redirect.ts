/**
 * Chặn open redirect qua `/login?redirect=` (review PR #33).
 *
 * TẠI SAO: Next coi URL khác origin là external và điều hướng cứng (`router.push("//evil.com")`
 * rời khỏi site). Trình duyệt hiểu `//host` và `/\host` là URL không có scheme trỏ sang host khác,
 * nên chỉ "bắt đầu bằng /" là chưa đủ. Chỉ nhận đường dẫn nội bộ; còn lại trả `null` để nơi gọi
 * dùng trang mặc định của vai trò.
 */
export function sanitizeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  // Ký tự điều khiển/khoảng trắng bị trình duyệt bỏ qua khi phân tích URL ("/\t/evil.com").
  if (/\s/.test(value) || Array.from(value).some((ch) => ch.charCodeAt(0) < 0x20 || ch.charCodeAt(0) === 0x7f)) {
    return null;
  }
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
