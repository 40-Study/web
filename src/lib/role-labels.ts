/**
 * Nhãn hiển thị tiếng Việt cho mã vai trò hệ thống.
 *
 * Mã vai trò trong hệ thống là enum viết hoa (SYSTEM_ADMIN, ORG_OWNER, ...).
 * UI không nên hiển thị thẳng enum đó cho người dùng — dùng helper này để
 * lấy nhãn tiếng Việt, và rơi về chính mã vai trò khi gặp giá trị lạ.
 */

export const SYSTEM_ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "Quản trị hệ thống",
  ORG_OWNER: "Chủ tổ chức",
  TEACHER: "Giảng viên",
  STUDENT: "Học viên",
  PARENT: "Phụ huynh",
  TEACHER_APPLICANT: "Ứng viên giảng viên",
};

/** Trả về nhãn tiếng Việt của mã vai trò; mã không nhận diện được thì trả về chính mã đó. */
export function getSystemRoleLabel(roleCode: string): string {
  return SYSTEM_ROLE_LABELS[roleCode] ?? roleCode;
}

/**
 * Nhãn cho vai trò TRONG TỔ CHỨC (QA3-16). Vai trò tổ chức do admin tự đặt tên nên không có bảng dịch và API
 * không có trường tên hiển thị: mã hệ thống đã biết dùng nhãn tiếng Việt, mã tuỳ biến (vd `QA3_TEACHER`)
 * được viết lại cho dễ đọc ("Qa3 Teacher") thay vì lộ nguyên mã enum. Nơi hiển thị nên giữ mã gốc ở `title`.
 */
export function getOrgRoleLabel(roleCode: string): string {
  const known = SYSTEM_ROLE_LABELS[roleCode];
  if (known) return known;
  const words = roleCode.split(/[_\-\s]+/).filter(Boolean);
  if (words.length === 0) return roleCode;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
