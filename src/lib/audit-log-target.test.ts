import { describe, expect, it } from "vitest";
import type { AuditLogItem } from "@/services/audit-log.service";
import { auditContextText, auditTargetText } from "./audit-log-target";

const log = (over: Partial<AuditLogItem>): AuditLogItem => ({
  id: "l1",
  created_at: "2026-11-23T08:00:00Z",
  actor: null,
  action: "user.org_role_assign",
  target_type: "user",
  target_id: "52ed9bd3-0000-4000-8000-000000000000",
  status_code: 200,
  ip: null,
  metadata: null,
  ...over,
});

const orgMeta = {
  organization_id: "o1",
  organization_name: "QA3 Org 261104",
  role_code: "ORG_TEACHER",
  role_name: "ORG_TEACHER",
  target_user_id: "52ed9bd3-0000-4000-8000-000000000000",
  target_user_name: "Đặng Bá Quân",
};

describe("auditTargetText (QA4-A02)", () => {
  it("dịch kiểu đối tượng sang tiếng Việt và dùng tên người dùng từ metadata", () => {
    expect(auditTargetText(log({ metadata: orgMeta }))).toBe("Người dùng: Đặng Bá Quân");
  });

  it("metadata null (dòng cũ): nhãn tiếng Việt + ID, không lộ kiểu tiếng Anh", () => {
    expect(auditTargetText(log({}))).toBe("Người dùng: 52ed9bd3-0000-4000-8000-000000000000");
  });

  it("kiểu lạ hiện nguyên mã; không có đối tượng thì gạch ngang", () => {
    expect(auditTargetText(log({ target_type: "gadget", target_id: "g1" }))).toBe("gadget: g1");
    expect(auditTargetText(log({ target_type: "", target_id: null }))).toBe("—");
  });
});

describe("auditContextText (QA4-A02)", () => {
  it("nêu tổ chức và vai trò (nhãn tiếng Việt từ role_code)", () => {
    expect(auditContextText(log({ metadata: orgMeta }))).toBe("Tổ chức QA3 Org 261104 · Vai trò Giảng viên");
  });

  it("không có role_code thì dùng role_name; thiếu cả hai trường thì null", () => {
    expect(auditContextText(log({ metadata: { role_name: "Trợ giảng" } }))).toBe("Vai trò Trợ giảng");
    expect(auditContextText(log({ metadata: null }))).toBeNull();
    expect(auditContextText(log({ metadata: { old: "0", new: "10" } }))).toBeNull();
  });
});
