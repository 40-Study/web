import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UnifiedRole } from "@/services/auth.service";

const myRoles = vi.hoisted(() => ({ data: undefined as UnifiedRole[] | undefined }));
vi.mock("@/hooks/queries/use-auth", () => ({
  useMyRoles: () => ({ data: myRoles.data ? { roles: myRoles.data } : undefined }),
}));

import { ClassSourceBadge, classSourceLabel } from "./class-source-badge";

describe("classSourceLabel", () => {
  it("không có organization_id (undefined/null/rỗng) là lớp cá nhân", () => {
    const names = new Map([["org-1", "Trung tâm A"]]);
    expect(classSourceLabel(undefined, names)).toBe("Cá nhân");
    expect(classSourceLabel(null, names)).toBe("Cá nhân");
    expect(classSourceLabel("", names)).toBe("Cá nhân");
  });

  it("tổ chức tra được tên thì dùng tên, không tra được thì nhãn chung (không in UUID)", () => {
    const names = new Map([["org-1", "Trung tâm A"]]);
    expect(classSourceLabel("org-1", names)).toBe("Trung tâm A");
    expect(classSourceLabel("org-9", names)).toBe("Tổ chức");
  });
});

describe("ClassSourceBadge", () => {
  it("hiện tên tổ chức lấy từ vai trò của người dùng", () => {
    myRoles.data = [
      { id: "r", type: "organization", role_name: "GIANG_VIEN", display_name: "GV", organization_id: "org-1", organization_name: "Trung tâm A" },
    ];
    render(<ClassSourceBadge organizationId="org-1" />);
    expect(screen.getByText("Trung tâm A")).toBeTruthy();
  });
});
