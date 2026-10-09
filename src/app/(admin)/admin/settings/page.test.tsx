/**
 * /admin/settings "Cấu hình hệ thống" (phase 5, contract C4): hiện phí nền tảng hiện hành + người/thời
 * điểm cập nhật cuối, kiểm tra 0-100 trước khi gọi PUT. Hook dữ liệu được mock.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import type { AdminSettings } from "@/services/admin-report.service";

const mockUpdate = vi.fn();
let mockSettings: AdminSettings;

vi.mock("@/hooks/queries/use-admin-settings", () => ({
  useAdminSettings: () => ({
    data: mockSettings,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/queries/use-admin-reports", () => ({
  useUpdatePlatformFeeSetting: () => ({ mutate: mockUpdate, isPending: false }),
}));

// eslint-disable-next-line import/first
import AdminSettingsPage from "./page";

function setPermissions(permissions: string[]) {
  useAuthStore.setState({
    sessionStatus: "authenticated",
    permissions,
  } as Partial<ReturnType<typeof useAuthStore.getState>>);
}

function feeInput() {
  return screen.getByLabelText(/Phí nền tảng \(%\)/) as HTMLInputElement;
}

describe("AdminSettingsPage — cấu hình hệ thống", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockSettings = {
      platform_fee_percent: 12.5,
      updated_at: "2026-10-08T03:00:00Z", // 10:00 giờ Việt Nam
      updated_by: { id: "u-1", name: "Quản trị viên Lan" },
    };
    setPermissions(["SYSTEM_SETTINGS_MANAGE"]);
  });

  it("hiện tiêu đề, thẻ Phí nền tảng, giá trị hiện hành và người cập nhật cuối", () => {
    render(<AdminSettingsPage />);

    expect(screen.getByRole("heading", { name: "Cấu hình hệ thống" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Phí nền tảng" })).toBeTruthy();
    expect(feeInput().value).toBe("12.5");
    const meta = screen.getByText(/Cập nhật lần cuối bởi/);
    expect(meta.textContent).toContain("Quản trị viên Lan");
    expect(meta.textContent).toContain("10:00");
    expect(meta.textContent).toContain("08/10/2026");
  });

  it("chưa từng cấu hình (updated_at/updated_by null) -> nói rõ là mặc định, không hiện 'Invalid Date'", () => {
    mockSettings = { platform_fee_percent: 0, updated_at: null, updated_by: null };
    render(<AdminSettingsPage />);

    expect(feeInput().value).toBe("0");
    expect(screen.getByText(/Chưa từng được chỉnh sửa/)).toBeTruthy();
    expect(screen.queryByText(/Cập nhật lần cuối bởi/)).toBeNull();
    expect(document.body.textContent).not.toContain("Invalid Date");
  });

  it.each(["101", "-1", "", "   ", "abc", "5.123", "100.01"])(
    "giá trị %j không hợp lệ -> báo lỗi tại chỗ và KHÔNG gọi PUT",
    (bad) => {
      render(<AdminSettingsPage />);
      fireEvent.change(feeInput(), { target: { value: bad } });
      fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(screen.getByRole("alert").textContent).toMatch(/0 đến 100|Nhập/);
    },
  );

  it.each([
    ["0", 0],
    ["100", 100],
    ["7.25", 7.25],
  ])("giá trị hợp lệ %j -> gọi PUT với số %d", (typed, expected) => {
    render(<AdminSettingsPage />);
    fireEvent.change(feeInput(), { target: { value: typed } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate.mock.calls[0][0]).toBe(expected);
  });

  it("thiếu quyền SYSTEM_SETTINGS_MANAGE -> không hiện form", () => {
    setPermissions([]);
    render(<AdminSettingsPage />);

    expect(screen.queryByLabelText(/Phí nền tảng \(%\)/)).toBeNull();
    expect(screen.getByText(/không có quyền/i)).toBeTruthy();
  });
});
