import { describe, expect, it } from "vitest";
import { getSystemRoleLabel, SYSTEM_ROLE_LABELS } from "./role-labels";

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
