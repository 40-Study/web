/**
 * Bảng lệnh Ctrl+K của khu /admin phải dùng ĐÚNG danh sách menu đã lọc quyền: admin thiếu
 * SYSTEM_SETTINGS_MANAGE không được thấy "Nhật ký hoạt động" ở sidebar thì cũng không được thấy trong bảng lệnh.
 */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import AdminLayout from "./layout";
import { useAuthStore } from "@/stores/auth.store";
import { renderWithProviders } from "@/test/utils";

async function openPaletteAndSearch(query: string) {
  renderWithProviders(
    <AdminLayout>
      <div>NOI DUNG ADMIN</div>
    </AdminLayout>
  );
  await screen.findByText("NOI DUNG ADMIN");
  fireEvent.keyDown(document, { key: "k", ctrlKey: true });
  fireEvent.change(screen.getByRole("combobox", { name: "Tìm chức năng" }), { target: { value: query } });
}

beforeEach(() => {
  useAuthStore.getState().reset();
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setActiveRole("SYSTEM_ADMIN");
});

describe("(admin)/layout — bảng lệnh Ctrl+K", () => {
  it("admin thiếu SYSTEM_SETTINGS_MANAGE không thấy mục bị ẩn khỏi menu", async () => {
    useAuthStore.getState().setPermissions([]);
    await openPaletteAndSearch("nhat ky");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toContain("nhat ky");
  });

  it("admin có quyền thì tìm thấy, và mục khớp trỏ đúng trang", async () => {
    useAuthStore.getState().setPermissions(["SYSTEM_SETTINGS_MANAGE"]);
    await openPaletteAndSearch("nhat ky");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Nhật ký hoạt độngTra cứu ai đã làm gì trên hệ thống",
    ]);
  });

  it('gõ "rut tien" ra "Rút tiền giảng viên"', async () => {
    await openPaletteAndSearch("rut tien");
    expect(screen.getByRole("option", { selected: true }).textContent).toContain("Rút tiền giảng viên");
  });
});
