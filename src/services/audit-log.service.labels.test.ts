import { describe, expect, it } from "vitest";
import { AUDIT_ACTION_LABEL, auditActionLabel } from "./audit-log.service";

/**
 * Bản chép của `model.AuditActions` (backend/internal/model/audit_log.go) — SSOT mã hành động.
 * Thêm mã ở backend mà quên nhãn ở web thì admin thấy mã thô (smoke 2: `report.moderate`, N4i).
 * Khi backend thêm/bỏ mã, cập nhật danh sách này cùng nhãn tương ứng.
 */
const BACKEND_AUDIT_ACTIONS = [
  "user.lock",
  "user.unlock",
  "user.role_assign",
  "user.role_revoke",
  "system_role.create",
  "system_role.update",
  "system_role.delete",
  "system_role.restore",
  "system_role.permissions_change",
  "permission.update",
  "course.approve",
  "course.reject",
  "teacher_application.approve",
  "teacher_application.reject",
  "report.status_update",
  "report.delete",
  "report.moderate",
  "order.refund",
  "order.late_refund",
  "withdrawal.approve",
  "withdrawal.reject",
  "withdrawal.mark_completed",
  "setting.platform_fee_update",
  "notification.broadcast",
];

describe("nhãn tiếng Việt cho mã hành động nhật ký", () => {
  it.each(BACKEND_AUDIT_ACTIONS)("%s có nhãn (không hiện mã thô)", (code) => {
    expect(auditActionLabel(code)).not.toBe(code);
    expect(auditActionLabel(code).trim()).not.toBe("");
  });

  it("report.moderate -> Kiểm duyệt từ báo cáo", () => {
    expect(auditActionLabel("report.moderate")).toBe("Kiểm duyệt từ báo cáo");
  });

  it("không có nhãn thừa cho mã backend không còn", () => {
    expect(Object.keys(AUDIT_ACTION_LABEL).sort()).toEqual([...BACKEND_AUDIT_ACTIONS].sort());
  });

  it("mã lạ hiện nguyên mã", () => {
    expect(auditActionLabel("future.action")).toBe("future.action");
  });
});
