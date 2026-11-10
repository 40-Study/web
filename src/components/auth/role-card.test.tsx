/**
 * roleNameToRoleType — "TEACHER_APPLICANT" chứa chữ "teacher", nên nhánh applicant PHẢI kiểm trước
 * nhánh teacher; nếu không ứng viên hiện sai thành thẻ "Giáo viên".
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleCard, roleNameToRoleType } from "./role-card";

describe("roleNameToRoleType", () => {
  it("TEACHER_APPLICANT → applicant (không bị nhận nhầm là teacher)", () => {
    expect(roleNameToRoleType("TEACHER_APPLICANT")).toBe("applicant");
  });

  it("TEACHER vẫn → teacher", () => {
    expect(roleNameToRoleType("TEACHER")).toBe("teacher");
  });

  it("QA-C-10: ORG_OWNER có thẻ riêng, không trùng thẻ (và icon) của SYSTEM_ADMIN", () => {
    expect(roleNameToRoleType("ORG_OWNER")).toBe("owner");
    expect(roleNameToRoleType("SYSTEM_ADMIN")).toBe("admin");
  });
});

describe("RoleCard — QA-C-10", () => {
  it("thẻ chưa chọn không mang class nền/viền của trạng thái chọn, kể cả khi hover", () => {
    render(<RoleCard role="owner" label="Chủ tổ chức" />);
    const card = screen.getByRole("radio");
    expect(card.getAttribute("aria-checked")).toBe("false");
    expect(card.className).not.toMatch(/hover:bg-muted|bg-primary\/10/);
    expect(card.getAttribute("aria-label")).toContain("Chủ tổ chức");
  });
});
