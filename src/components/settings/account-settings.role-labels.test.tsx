/** QA5 S5-05: hộp thoại "Chuyển vai trò" hiện nhãn tiếng Việt cho vai trong tổ chức, không lộ "ORG_STUDENT". */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import { useAuthStore } from "@/stores/auth.store";
import { AccountSettings } from "./account-settings";

const ORG_STUDENT = {
  id: "r1", type: "organization" as const, role_name: "ORG_STUDENT", display_name: "ORG_STUDENT",
  organization_id: "o1", organization_name: "Trung tâm Lập trình ABC",
};
const SYSTEM_STUDENT = { id: "r2", type: "system" as const, role_name: "STUDENT", display_name: "STUDENT" };
// Hàng "Chuyển vai trò" chỉ hiện từ hai vai CHUYỂN ĐƯỢC (isSelectableRole); ORG_STUDENT không tính, nên cần thêm vai thứ hai.
const SYSTEM_PARENT = { id: "r3", type: "system" as const, role_name: "PARENT", display_name: "PARENT" };

beforeEach(() => {
  useAuthStore.setState({
    roles: [ORG_STUDENT, SYSTEM_STUDENT, SYSTEM_PARENT],
    activeRole: "STUDENT",
    activeUnifiedRole: SYSTEM_STUDENT,
  });
});

describe("AccountSettings — nhãn vai trò", () => {
  it("vai ORG_STUDENT hiện 'Học viên' kèm tên tổ chức, không phải mã", () => {
    renderWithQuery(<AccountSettings user={{ email: "a@b.vn", has2FA: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "Chuyển" }));
    expect(screen.queryByText("ORG_STUDENT")).toBeNull();
    expect(screen.getByText("Trung tâm Lập trình ABC")).toBeTruthy();
    // Hàng của vai tổ chức: nhãn "Học viên" nằm cùng khối với tên tổ chức.
    const row = screen.getByText("Trung tâm Lập trình ABC").closest("button") as HTMLElement;
    expect(row.textContent).toContain("Học viên");
  });
});
