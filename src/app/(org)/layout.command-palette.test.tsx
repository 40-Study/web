/** Bảng lệnh Ctrl+K của khu /org lấy đúng menu tổ chức (SSOT `orgMenu`), tìm không dấu. */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import OrgLayout from "./layout";
import { orgMenu } from "@/lib/org-menu";
import { useAuthStore } from "@/stores/auth.store";
import { renderWithProviders } from "@/test/utils";

beforeEach(() => {
  useAuthStore.getState().reset();
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setActiveRole("ORG_OWNER");
  useAuthStore.getState().setActiveOrg({ id: "org-1", name: "Trường ABC" });
});

describe("(org)/layout — bảng lệnh Ctrl+K", () => {
  it("mở bằng nút trên header, liệt kê đủ mục menu tổ chức và lọc không dấu", async () => {
    renderWithProviders(
      <OrgLayout>
        <div>NOI DUNG TO CHUC</div>
      </OrgLayout>
    );
    await screen.findByText("NOI DUNG TO CHUC");

    fireEvent.click(screen.getByRole("button", { name: /Tìm chức năng/ }));
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(orgMenu.map((item) => `${item.label}${item.description}`));

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "thanh vien" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Thành viênThêm, gỡ và đổi vai thành viên",
    ]);
  });
});
