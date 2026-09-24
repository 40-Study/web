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
