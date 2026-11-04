/**
 * Số điện thoại của hồ sơ (P-03, QA3 261104). Backend chỉ nhận E.164 (`validate:"omitempty,e164"`,
 * authDTO.go) nên số nhập kiểu Việt Nam "0912345678" bị từ chối bằng toast chung. Chuẩn hoá phía client
 * trước khi gửi và báo lỗi ngay dưới ô nhập. Nhận: "0xxxxxxxxx" (10 số), "84xxxxxxxxx", "0084xxxxxxxxx",
 * "+84xxxxxxxxx" và mọi số quốc tế "+<mã nước><số>" (8-15 chữ số, không bắt đầu bằng 0).
 */
export const PHONE_FORMAT_MESSAGE = "Số điện thoại không hợp lệ. Nhập dạng 0912345678 hoặc +84912345678";

const VN_LOCAL = /^0(\d{9})$/;
const VN_INTERNATIONAL = /^(?:\+|00)?84(\d{9})$/;
const E164 = /^\+[1-9]\d{7,14}$/;

/** Số E.164 (`+84912345678`) hoặc `null` nếu không hợp lệ. Chuỗi rỗng không hợp lệ: nơi gọi tự xử lý "để trống". */
export function normalizePhone(raw: string): string | null {
  const compact = raw.trim().replace(/[\s().-]/g, "");
  const vnLocal = compact.match(VN_LOCAL);
  if (vnLocal) return `+84${vnLocal[1]}`;
  const vnInternational = compact.match(VN_INTERNATIONAL);
  if (vnInternational) return `+84${vnInternational[1]}`;
  return E164.test(compact) ? compact : null;
}
