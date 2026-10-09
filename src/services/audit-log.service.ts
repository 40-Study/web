/**
 * Admin audit log — nhật ký hoạt động quản trị (contract C2, quyền SYSTEM_SETTINGS_MANAGE).
 * Endpoints: GET /admin/audit-logs, GET /admin/audit-logs/actions.
 * Đối chiếu backend internal/dto/audit_log_dto.go (đóng băng bởi contract.md).
 */

import { api } from "@/lib/api-client";

export interface AuditActor {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogItem {
  id: string;
  created_at: string;
  /** null khi tài khoản người thao tác không còn. */
  actor: AuditActor | null;
  action: string;
  /** "" với hành động không có đối tượng đích (vd gửi thông báo hàng loạt). */
  target_type: string;
  target_id: string | null;
  status_code: number;
  ip: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditLogList {
  items: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuditLogParams {
  page?: number;
  page_size?: number;
  action?: string;
  actor_id?: string;
  target_type?: string;
  target_id?: string;
  /** RFC3339 hoặc YYYY-MM-DD. */
  from?: string;
  to?: string;
}

type Envelope<T> = { message: string; data: T };

/** Bỏ tham số rỗng để không gửi `?action=&actor_id=` (backend coi rỗng là không lọc, nhưng URL gọn hơn). */
function compact(params?: AuditLogParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") out[key] = value;
  }
  return out;
}

export const auditLogService = {
  /** GET /admin/audit-logs — mới nhất trước. */
  list: (params?: AuditLogParams) =>
    api
      .get<Envelope<AuditLogList>>("/admin/audit-logs", { params: compact(params) })
      .then((r) => r.data.data),

  /** GET /admin/audit-logs/actions — mã hành động hợp lệ (SSOT backend) cho ô lọc. */
  actions: () =>
    api.get<Envelope<string[]>>("/admin/audit-logs/actions").then((r) => r.data.data),
};

/** Nhãn tiếng Việt theo mã hành động (khoá = model.AuditActions của backend). Mã lạ hiện nguyên mã. */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "user.lock": "Khóa tài khoản",
  "user.unlock": "Mở khóa tài khoản",
  "user.role_assign": "Gán vai trò hệ thống cho người dùng",
  "user.role_revoke": "Thu hồi vai trò hệ thống của người dùng",
  "system_role.create": "Tạo vai trò hệ thống",
  "system_role.update": "Cập nhật vai trò hệ thống",
  "system_role.delete": "Xóa vai trò hệ thống",
  "system_role.restore": "Khôi phục vai trò hệ thống",
  "system_role.permissions_change": "Đổi quyền của vai trò hệ thống",
  "permission.update": "Cập nhật quyền",
  "course.approve": "Duyệt khóa học",
  "course.reject": "Từ chối khóa học",
  "teacher_application.approve": "Duyệt hồ sơ giáo viên",
  "teacher_application.reject": "Từ chối hồ sơ giáo viên",
  "report.status_update": "Đổi trạng thái báo cáo vi phạm",
  "report.delete": "Xóa báo cáo vi phạm",
  "order.refund": "Hoàn tiền đơn hàng",
  "order.late_refund": "Ghi nhận hoàn tiền muộn",
  "withdrawal.approve": "Duyệt yêu cầu rút tiền",
  "withdrawal.reject": "Từ chối yêu cầu rút tiền",
  "withdrawal.mark_completed": "Đánh dấu rút tiền hoàn tất",
  "setting.platform_fee_update": "Đổi % phí nền tảng",
  "notification.broadcast": "Gửi thông báo hàng loạt",
};

export function auditActionLabel(code: string): string {
  return AUDIT_ACTION_LABEL[code] ?? code;
}
