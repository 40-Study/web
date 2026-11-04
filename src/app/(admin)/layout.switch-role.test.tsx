/** QA3-20: menu tài khoản của admin có "Chuyển vai trò" khi người dùng có từ 2 vai trò trở lên. */

import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const switchMutate = vi.fn();
let myRoles: { roles: unknown[] } | undefined;

vi.mock("@/hooks/queries/use-auth", () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
  useSwitchRole: () => ({ mutate: switchMutate, isPending: false }),
  useMyRoles: () => ({ data: myRoles }),
}));

import AdminLayout from "./layout";
import { useAuthStore } from "@/stores/auth.store";
import { renderWithProviders } from "@/test/utils";
import type { UnifiedRole } from "@/services/auth.service";

const adminRole: UnifiedRole = { id: "sys-admin", type: "system", role_name: "SYSTEM_ADMIN", display_name: "SYSTEM_ADMIN" };
const ownerRole: UnifiedRole = {
  id: "org-owner",
  type: "organization",
  role_name: "ORG_OWNER",
  display_name: "ORG_OWNER - QA3 Org",
  organization_id: "org-1",
  organization_name: "QA3 Org 261104",
};

function setup(roles: UnifiedRole[]) {
  myRoles = { roles };
  const store = useAuthStore.getState();
  store.setSessionStatus("authenticated");
  store.setActiveRole("SYSTEM_ADMIN");
  store.setActiveUnifiedRole(adminRole);
  store.setRoles(roles);
  renderWithProviders(
    <AdminLayout>
      <div>NOI DUNG ADMIN</div>
    </AdminLayout>
  );
}

const openProfileMenu = () => fireEvent.click(screen.getByText("Administrator").closest("button")!);

describe("(admin)/layout — QA3-20 chuyển vai trò", () => {
  beforeEach(() => {
    switchMutate.mockReset();
    useAuthStore.getState().reset();
  });

  it("admin có thêm vai trò chủ tổ chức: thấy 'Chuyển vai trò', chọn vai trò kia gọi switch-role với đúng tham số", async () => {
    setup([adminRole, ownerRole]);
    await screen.findByText("NOI DUNG ADMIN");
    openProfileMenu();

    fireEvent.click(screen.getByRole("button", { name: /Chuyển vai trò/ }));
    // Vai trò đang dùng bị khoá, vai trò còn lại có tên tổ chức ở dòng phụ.
    expect((screen.getByRole("button", { name: /Quản trị hệ thống/ }) as HTMLButtonElement).disabled).toBe(true);
    const ownerButton = screen.getByRole("button", { name: /Chủ tổ chức/ });
    expect(ownerButton.textContent).toContain("QA3 Org 261104");
    fireEvent.click(ownerButton);

    expect(switchMutate).toHaveBeenCalledWith({ role_id: "org-owner", role_type: "organization", organization_id: "org-1" });
  });

  it("chỉ có một vai trò: không hiện 'Chuyển vai trò', vẫn có Đăng xuất", async () => {
    setup([adminRole]);
    await screen.findByText("NOI DUNG ADMIN");
    openProfileMenu();

    expect(screen.queryByRole("button", { name: /Chuyển vai trò/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Đăng xuất/ })).toBeTruthy();
  });
});
