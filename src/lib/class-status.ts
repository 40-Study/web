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
