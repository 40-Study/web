/**
 * roleNameToRoleType — "TEACHER_APPLICANT" chứa chữ "teacher", nên nhánh applicant PHẢI kiểm trước
 * nhánh teacher; nếu không ứng viên hiện sai thành thẻ "Giáo viên".
 */

import { describe, expect, it } from "vitest";
import { roleNameToRoleType } from "./role-card";

describe("roleNameToRoleType", () => {
  it("TEACHER_APPLICANT → applicant (không bị nhận nhầm là teacher)", () => {
    expect(roleNameToRoleType("TEACHER_APPLICANT")).toBe("applicant");
  });

  it("TEACHER vẫn → teacher", () => {
    expect(roleNameToRoleType("TEACHER")).toBe("teacher");
  });
});
