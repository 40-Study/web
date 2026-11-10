import { describe, expect, it } from "vitest";
import { ORG_SCOPED_ROLE_BADGE, isOrgScopedSystemRole, roleUserCountLabel } from "./org-scoped-role";

describe("QA-C-15: vai ORG_OWNER không hiện '0 người'", () => {
  it("ORG_OWNER có 0 lượt gán hệ thống vẫn ra ghi chú 'Gán theo tổ chức'", () => {
    expect(isOrgScopedSystemRole("ORG_OWNER")).toBe(true);
    expect(roleUserCountLabel({ name: "ORG_OWNER", userCount: 0 })).toBe(ORG_SCOPED_ROLE_BADGE);
  });

  it("vai hệ thống khác vẫn đếm người bằng tiếng Việt (QA-C-11: không còn 'user')", () => {
    expect(isOrgScopedSystemRole("TEACHER")).toBe(false);
    expect(roleUserCountLabel({ name: "TEACHER", userCount: 3 })).toBe("3 người");
    expect(roleUserCountLabel({ name: "TEACHER", userCount: null })).toBe("…");
    expect(roleUserCountLabel({ name: "TEACHER", userCount: null, userCountError: true })).toBe("lỗi");
  });
});
