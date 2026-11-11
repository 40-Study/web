import { describe, expect, it } from "vitest";

import { adminMenu, getVisibleAdminMenu } from "./admin-menu";

const GATED = ["Nhật ký hoạt động", "Thông báo hệ thống", "Cấu hình hệ thống"];

describe("getVisibleAdminMenu", () => {
  it("ẩn các mục cần SYSTEM_SETTINGS_MANAGE khi admin thiếu quyền", () => {
    const visible = getVisibleAdminMenu([]).map((item) => item.label);
    for (const label of GATED) expect(visible).not.toContain(label);
    expect(visible).toContain("Rút tiền giảng viên");
    expect(visible).toHaveLength(adminMenu.length - GATED.length);
  });

  it("hiện đủ menu khi có quyền", () => {
    expect(getVisibleAdminMenu(["SYSTEM_SETTINGS_MANAGE"])).toHaveLength(adminMenu.length);
  });
});
