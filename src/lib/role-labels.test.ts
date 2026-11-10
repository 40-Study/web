import { describe, expect, it } from "vitest";
import { getOrgRoleLabel, getSystemRoleLabel, SYSTEM_ROLE_LABELS } from "./role-labels";

describe("getSystemRoleLabel", () => {
  it("trả về nhãn tiếng Việt cho các mã vai trò đã biết", () => {
    expect(getSystemRoleLabel("SYSTEM_ADMIN")).toBe("Quản trị hệ thống");
    expect(getSystemRoleLabel("ORG_OWNER")).toBe("Chủ tổ chức");
    expect(getSystemRoleLabel("TEACHER")).toBe("Giảng viên");
    expect(getSystemRoleLabel("STUDENT")).toBe("Học viên");
    expect(getSystemRoleLabel("PARENT")).toBe("Phụ huynh");
    expect(getSystemRoleLabel("TEACHER_APPLICANT")).toBe("Ứng viên giảng viên");
  });

  it("rơi về chính mã vai trò khi gặp giá trị lạ", () => {
    expect(getSystemRoleLabel("UNKNOWN_ROLE")).toBe("UNKNOWN_ROLE");
    expect(getSystemRoleLabel("")).toBe("");
  });

  it("không có nhãn nào trùng với mã vai trò", () => {
    for (const [code, label] of Object.entries(SYSTEM_ROLE_LABELS)) {
      expect(label).not.toBe(code);
    }
  });
});

describe("getOrgRoleLabel (QA3-16)", () => {
  it("mã hệ thống đã biết dùng nhãn tiếng Việt", () => {
    expect(getOrgRoleLabel("ORG_OWNER")).toBe("Chủ tổ chức");
    expect(getOrgRoleLabel("TEACHER")).toBe("Giảng viên");
  });

  it("QA-C-01: vai mặc định của tổ chức ORG_TEACHER/ORG_STUDENT có nhãn tiếng Việt, không thành 'Org Teacher'", () => {
    expect(getOrgRoleLabel("ORG_TEACHER")).toBe("Giảng viên");
    expect(getOrgRoleLabel("ORG_STUDENT")).toBe("Học viên");
    expect(getOrgRoleLabel("ORG_OWNER")).toBe("Chủ tổ chức");
  });

  it("mã tuỳ biến không lộ dạng enum viết hoa có gạch dưới", () => {
    expect(getOrgRoleLabel("QA3_TEACHER")).toBe("Qa3 Teacher");
    expect(getOrgRoleLabel("class-assistant")).toBe("Class Assistant");
  });

  it("chuỗi rỗng/chỉ ký tự phân cách thì trả lại nguyên văn, không trả chuỗi rỗng khó hiểu", () => {
    expect(getOrgRoleLabel("")).toBe("");
    expect(getOrgRoleLabel("__")).toBe("__");
  });
});
