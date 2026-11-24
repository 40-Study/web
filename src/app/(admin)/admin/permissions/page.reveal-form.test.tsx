/**
 * QA6-A01: "Sửa mô tả" ở dòng thấp của 28 quyền mở form ở cột phải, ngoài tầm nhìn nên nút trông như hỏng. Sau khi
 * bấm, form phải được cuộn vào khung nhìn và ô mô tả nhận focus. (Vị trí thật trong khung nhìn đo bằng trình
 * duyệt ở 1280 và 390; jsdom không dàn trang nên ở đây kiểm đúng lệnh cuộn + focus.)
 */
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import AdminPermissionsPage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const PERMISSIONS = Array.from({ length: 28 }, (_, i) => ({ id: `perm-${i}`, name: `PERM_${i}`, description: `Mô tả ${i}` }));
const scrollIntoView = vi.fn();

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async () => envelope({ permissions: PERMISSIONS, total: PERMISSIONS.length }));
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["ROLES_MANAGE_SYSTEM"]);
  scrollIntoView.mockReset();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  // @ts-expect-error jsdom không định nghĩa scrollIntoView; trả về trạng thái gốc cho test khác.
  delete Element.prototype.scrollIntoView;
});

describe("/admin/permissions — QA6-A01 form sửa vào tầm nhìn", () => {
  it("bấm 'Sửa mô tả' ở dòng cuối: form được cuộn vào khung nhìn và ô mô tả có focus", async () => {
    renderWithProviders(<AdminPermissionsPage />);
    await screen.findByText("PERM_27");

    fireEvent.click(screen.getAllByRole("button", { name: "Sửa mô tả" })[27]);

    const textarea = screen.getByLabelText("Mô tả quyền") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Mô tả 27");
    expect(document.activeElement).toBe(textarea);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(textarea.closest("form"));
  });

  it("mỗi lần bấm 'Sửa mô tả' (kể cả quyền khác) lại cuộn tới form", async () => {
    renderWithProviders(<AdminPermissionsPage />);
    await screen.findByText("PERM_0");
    const buttons = screen.getAllByRole("button", { name: "Sửa mô tả" });

    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[5]);

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect((screen.getByLabelText("Mô tả quyền") as HTMLTextAreaElement).value).toBe("Mô tả 5");
  });
});
