/**
 * Cách hiển thị "Đối tượng" của một dòng nhật ký (QA4-A02). Trước đây in thẳng `target_type: target_id`
 * ("user: 52ed9bd3-…"): kiểu tiếng Anh + UUID, không biết tổ chức hay vai trò nào.
 *
 * Contract 6 (backend): thao tác thêm/đổi/xoá thành viên tổ chức ghi metadata
 * `{ organization_id, organization_name, role_code, role_name, target_user_id, target_user_name }`.
 * Dòng cũ (metadata null) vẫn hiện được: rơi về nhãn kiểu + ID.
 */

import type { AuditLogItem } from "@/services/audit-log.service";
import { getOrgRoleLabel } from "@/lib/role-labels";

/** Nhãn tiếng Việt theo `target_type` của backend. Kiểu lạ hiện nguyên mã. */
export const AUDIT_TARGET_TYPE_LABEL: Record<string, string> = {
  user: "Người dùng",
  organization: "Tổ chức",
  system_role: "Vai trò hệ thống",
  org_role: "Vai trò tổ chức",
  permission: "Quyền",
  category: "Danh mục",
  tag: "Tag",
  voucher: "Voucher",
  contest: "Cuộc thi",
  course: "Khoá học",
  teacher_application: "Hồ sơ giáo viên",
  report: "Báo cáo vi phạm",
  order: "Đơn hàng",
  withdrawal: "Yêu cầu rút tiền",
  setting: "Cài đặt",
};

function metaText(log: AuditLogItem, key: string): string | undefined {
  const value = log.metadata?.[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/** "Người dùng: Đặng Bá Quân" khi có tên, ngược lại "Người dùng: <id>"; không có đối tượng thì "—". */
export function auditTargetText(log: AuditLogItem): string {
  if (!log.target_type && !log.target_id) return "—";
  const type = log.target_type ? (AUDIT_TARGET_TYPE_LABEL[log.target_type] ?? log.target_type) : "";
  const name = metaText(log, "target_user_name") ?? metaText(log, "target_name");
  return [type, name ?? log.target_id].filter(Boolean).join(": ");
}

/** Dòng phụ "Tổ chức X · Vai trò Y" cho thao tác vai trò tổ chức; null khi metadata không có các trường này. */
export function auditContextText(log: AuditLogItem): string | null {
  const parts: string[] = [];
  const org = metaText(log, "organization_name");
  if (org) parts.push(`Tổ chức ${org}`);
  const roleCode = metaText(log, "role_code");
  const role = roleCode ? getOrgRoleLabel(roleCode) : metaText(log, "role_name");
  if (role) parts.push(`Vai trò ${role}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}
