/** QA8-A09: trang chặn /org (quản trị hệ thống mở /org) phải có landmark <main id="main-content"> cho skip link. */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/queries/use-auth", () => ({
  useMyRoles: () => ({ data: { roles: [] }, isLoading: false }),
  useSwitchRole: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }),
}));

import { OrgAreaGate } from "./org-area-gate";

describe("OrgAreaGate — QA8-A09", () => {
  it("bọc nội dung trong <main id=main-content> (đích của 'Bỏ qua điều hướng')", () => {
    render(<OrgAreaGate />);
    const main = document.querySelector("main#main-content");
    expect(main).not.toBeNull();
    expect(main?.querySelector("h1")?.textContent).toBe("Khu quản lý tổ chức");
    expect(document.querySelectorAll("main")).toHaveLength(1);
  });
});
