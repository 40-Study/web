/** QA3-16: vai trò tuỳ biến của tổ chức không được hiện dạng mã thô (QA3_TEACHER). */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrgMembersPage from "./page";

vi.mock("@/hooks/queries/use-org-area", () => ({
  useActiveOrgId: () => "org-1",
  useOrgMembers: () => ({
    data: [
      { user_id: "u1", name: "Giáo viên Hai", email: "teacher2@demo.com", roles: ["QA3_TEACHER"] },
      { user_id: "u2", name: "Chủ tổ chức", email: "owner@demo.com", roles: ["ORG_OWNER"] },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("/org/members — nhãn vai trò", () => {
  it("vai trò tuỳ biến hiện tên dễ đọc, vai trò hệ thống hiện tiếng Việt, không còn mã thô", () => {
    render(<OrgMembersPage />);
    expect(screen.queryByText("QA3_TEACHER")).toBeNull();
    expect(screen.getByText("Qa3 Teacher")).toBeTruthy();
    expect(screen.getByText("Chủ tổ chức", { selector: "div" })).toBeTruthy();
  });
});
