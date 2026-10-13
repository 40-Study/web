/**
 * Wave-2 W2-2 (contract-be4): trang thiết bị không còn đoạn IP "Không rõ" (backend không bao giờ gửi IP),
 * nhãn dựng từ user_agent, dòng gộp nhiều phiên hiện "N phiên", thiết bị hiện tại được đánh dấu.
 * Hai nơi cùng vẽ danh sách thiết bị (trang /settings/devices và tab trong /settings) nên test cả hai.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeviceSessionDto } from "@/services/auth.service";

const useDevices = vi.fn();
vi.mock("@/hooks/queries/use-auth", () => ({
  useDevices: () => useDevices(),
  useLogoutAll: () => ({ mutate: vi.fn(), isPending: false }),
}));

import DevicesPage from "@/app/(app)/settings/devices/page";
import { DevicesSettings } from "./devices-settings";

const CHROME_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

const devices: DeviceSessionDto[] = [
  {
    device_id: "cur",
    device_name: "Chrome Browser",
    user_agent: CHROME_MAC,
    logged_in_at: "2026-10-13T10:23:29+07:00",
    is_current: true,
    session_count: 1,
    device_ids: ["cur"],
  },
  {
    device_id: "old",
    device_name: "Mobile Browser",
    user_agent: SAFARI_IPHONE,
    logged_in_at: "2026-10-12T08:00:00+07:00",
    is_current: false,
    session_count: 3,
    device_ids: ["a", "b", "old"],
  },
];

beforeEach(() => {
  useDevices.mockReturnValue({ data: { devices }, isLoading: false });
});

describe.each([
  ["DevicesSettings (tab trong /settings)", () => <DevicesSettings />],
  ["DevicesPage (/settings/devices)", () => <DevicesPage />],
])("%s", (_name, view) => {
  it("không còn đoạn IP 'Không rõ'", () => {
    render(view());
    expect(screen.queryByText(/không rõ/i)).toBeNull();
  });

  it("nhãn dựng từ user_agent thay vì device_name hardcode", () => {
    render(view());
    expect(screen.getByText("Chrome trên macOS")).toBeTruthy();
    expect(screen.getByText("Safari trên iOS")).toBeTruthy();
    expect(screen.queryByText("Chrome Browser")).toBeNull();
  });

  it("chỉ dòng gộp nhiều phiên hiện 'N phiên'; thiết bị hiện tại được đánh dấu", () => {
    render(view());
    expect(screen.getAllByText(/phiên/)).toHaveLength(1);
    expect(screen.getByText(/3 phiên/)).toBeTruthy();
    expect(screen.getAllByText("Thiết bị này")).toHaveLength(1);
  });
});
