/**
 * Trạng thái lớp (backend: model.Class.Status = draft | active | archived). Một nơi duy nhất dịch sang
 * tiếng Việt để danh sách lớp của giảng viên, khu tổ chức và hộp thoại quản lý không lẫn "draft/active".
 */

export const CLASS_STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  active: "Đang hoạt động",
  archived: "Đã lưu trữ",
};

export function getClassStatusLabel(status?: string | null): string {
  if (!status) return CLASS_STATUS_LABELS.draft;
  return CLASS_STATUS_LABELS[status] ?? status;
}

export type ClassStatusBadgeVariant = "warning" | "success" | "secondary";

export function getClassStatusVariant(status?: string | null): ClassStatusBadgeVariant {
  if (status === "active") return "success";
  if (status === "archived") return "secondary";
  return "warning";
}

/**
 * Nhãn hiển thị của lớp, xét cả `is_ended` (QA-B-12: lớp Flutter K5 hết hạn 04/11 vẫn ghi "Đang hoạt động").
 * Lớp đang hoạt động mà backend báo đã qua ngày kết thúc thì ghi "Đã kết thúc"; lưu trữ/nháp giữ nhãn cũ.
 */
export function getClassDisplayBadge(cls: { status?: string | null; is_ended?: boolean }): {
  label: string;
  variant: ClassStatusBadgeVariant;
} {
  if (cls.is_ended === true && cls.status === "active") return { label: "Đã kết thúc", variant: "secondary" };
  return { label: getClassStatusLabel(cls.status), variant: getClassStatusVariant(cls.status) };
}

/**
 * Lớp lưu trữ là CHỈ ĐỌC: backend trả 409 CLASS_ARCHIVED cho mọi thao tác ghi, nên UI ẩn/khoá nút ghi theo `status`
 * mà backend đã trả thay vì để người dùng bấm rồi nhận lỗi.
 */
export const isClassArchived = (status?: string | null): boolean => status === "archived";

/** Lớp có thể chọn khi TẠO buổi/bài mới: bỏ lớp lưu trữ. */
export function selectableClasses<T extends { status?: string | null }>(classes: readonly T[]): T[] {
  return classes.filter((c) => !isClassArchived(c.status));
}
