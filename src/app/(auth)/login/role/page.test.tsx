/**
 * QA vòng 2 (G6 — N-04/A-P3-2): /login/role từng hiện thẳng display_name backend — mã thô
 * "STUDENT" cho vai trò hệ thống và "ORG_OWNER - <tên>" (hoặc "ORG_OWNER - " cụt khi tên tổ chức
 * rỗng) cho vai trò tổ chức. Nhãn phải là tiếng Việt từ lib/role-labels.ts.
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import LoginRolePage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import type { UnifiedRole } from "@/services/auth.service";

const ROLES: UnifiedRole[] = [
  { id: "sr-student", type: "system", role_name: "STUDENT", display_name: "STUDENT" },
  {
    id: "r-owner",
    type: "organization",
    role_name: "ORG_OWNER",
    display_name: "ORG_OWNER - Trường ABC",
    organization_id: "org-1",
    organization_name: "Trường ABC",
  },
  {
    id: "r-owner-blank",
    type: "organization",
    role_name: "ORG_OWNER",
    display_name: "ORG_OWNER - ",
    organization_id: "org-2",
    organization_name: "   ",
  },
];

beforeEach(() => {
  resetMockApi();
  useAuthStore.setState({ roles: ROLES, sessionToken: "session-1" });
});

describe("/login/role — nhãn vai trò tiếng Việt", () => {
  it("hiện 'Học viên'/'Chủ tổ chức', không hiện mã thô hay 'ORG_OWNER - '", () => {
    renderWithProviders(<LoginRolePage />);

    expect(screen.getByText("Học viên")).toBeTruthy();
    expect(screen.getAllByText("Chủ tổ chức")).toHaveLength(2);
    expect(screen.getByText("Trường ABC")).toBeTruthy();

    expect(screen.queryByText("STUDENT")).toBeNull();
    expect(screen.queryByText(/ORG_OWNER/)).toBeNull();
  });
});
