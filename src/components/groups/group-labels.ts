/** Nhãn tiếng Việt cho nhóm — một nguồn duy nhất cho trang danh sách và trang chi tiết. */

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Trưởng nhóm",
  ADMIN: "Quản trị",
  MODERATOR: "Điều hành",
  MEMBER: "Thành viên",
};

export const PRIVACY_LABELS: Record<string, string> = {
  PUBLIC: "Công khai",
  PRIVATE: "Riêng tư",
  SECRET: "Bí mật",
};

export const PRIVACY_DESCRIPTIONS: Record<string, string> = {
  PUBLIC: "Công khai - ai cũng tham gia được",
  PRIVATE: "Riêng tư - cần được duyệt",
  SECRET: "Bí mật - chỉ người được mời mới thấy nhóm",
};

export const TYPE_LABELS: Record<string, string> = {
  STUDY_GROUP: "Nhóm học tập",
  CLASS_GROUP: "Nhóm lớp học",
  COURSE_GROUP: "Nhóm khoá học",
  CUSTOM: "Nhóm tuỳ chọn",
};

export function roleLabel(role?: string): string {
  return (role && ROLE_LABELS[role]) || "Thành viên";
}

export function formatVnDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}
