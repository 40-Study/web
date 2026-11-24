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
  role_code: "3f2a9c1e-7b4d-4e0a-9d51-0c8f6a2b1e34",
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
  it("nêu tổ chức và vai trò từ role_name, không bao giờ in role_code (UUID của vai)", () => {
    const text = auditContextText(log({ metadata: orgMeta }));
    expect(text).toBe("Tổ chức QA3 Org 261104 · Vai trò Giảng viên");
    expect(text).not.toContain("3f2a9c1e");
  });

  it("gán nhiều vai một lần: role_name nối bằng ', ' thì hiện từng vai", () => {
    const meta = { ...orgMeta, role_code: "id-1, id-2", role_name: "ORG_TEACHER, QA3_STUDENT" };
    expect(auditContextText(log({ metadata: meta }))).toBe("Tổ chức QA3 Org 261104 · Vai trò Giảng viên, Qa3 Student");
  });

  it("chỉ có role_code (UUID) mà không có role_name: không hiện vai trò; thiếu cả hai thì null", () => {
    expect(auditContextText(log({ metadata: { role_code: "3f2a9c1e-7b4d" } }))).toBeNull();
    expect(auditContextText(log({ metadata: null }))).toBeNull();
    expect(auditContextText(log({ metadata: { old: "0", new: "10" } }))).toBeNull();
  });
});

// QA5-A02 / contract C4: mọi đối tượng được audit mang `metadata.target_name`; web ưu tiên tên, rơi về ID.
describe("auditTargetText: target_name (C4)", () => {
  it.each([
    ["tag", "Tag", "Lập trình"],
    ["category", "Danh mục", "Toán nâng cao"],
    ["system_role", "Vai trò hệ thống", "Kiểm duyệt viên"],
    ["voucher", "Voucher", "GIAM50"],
    ["course", "Khoá học", "ReactJS cơ bản"],
  ])("%s: hiện tên thay vì UUID", (type, label, name) => {
    const id = "534c6415-0000-4000-8000-000000000000";
    const text = auditTargetText(log({ target_type: type, target_id: id, metadata: { target_name: name } }));
    expect(text).toBe(`${label}: ${name}`);
    expect(text).not.toContain(id);
  });

  it("dòng cũ không có tên: vẫn rơi về ID", () => {
    expect(auditTargetText(log({ target_type: "tag", target_id: "t-1", metadata: null }))).toBe("Tag: t-1");
  });

  it("tên rỗng/khoảng trắng bị bỏ qua", () => {
    expect(auditTargetText(log({ target_type: "tag", target_id: "t-1", metadata: { target_name: "  " } }))).toBe("Tag: t-1");
  });

  // Review L3: contract C4 ghi "ưu tiên metadata.target_name, rồi nhãn cũ"; `target_user_name` là nhãn cũ.
  it("có cả target_name lẫn target_user_name: target_name thắng (đúng thứ tự C4)", () => {
    expect(
      auditTargetText(log({ metadata: { target_name: "Tên theo C4", target_user_name: "Nhãn cũ" } })),
    ).toBe("Người dùng: Tên theo C4");
  });

  it("chỉ có target_user_name (dòng vai trò tổ chức hiện nay): vẫn hiện tên đó", () => {
    expect(auditTargetText(log({ metadata: { target_user_name: "Nhãn cũ" } }))).toBe("Người dùng: Nhãn cũ");
  });
});
