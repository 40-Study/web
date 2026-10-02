/**
 * Cài đặt riêng tư: tên field của BACKEND là `leaderboard_display`. Web từng gửi/đọc `leaderboard_visibility`:
 * backend bỏ qua khoá lạ khi lưu và không trả khoá đó khi đọc, nên lựa chọn bảng xếp hạng không bao giờ được giữ.
 * Test dựng một backend giả đúng hợp đồng (chỉ nhận khoá đã biết, trả toàn bộ cài đặt) để chứng minh
 * "lưu xong, tải lại vẫn giữ giá trị" cả hai chiều đọc và ghi.
 */
import type { ReactNode } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Radix Select không thao tác được trong jsdom: thay bằng <select> thật, giữ nguyên value/onValueChange.
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: ReactNode;
  }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

import { userPreferenceService, type PrivacySettings } from "@/services/user-preference.service";
import { PrivacySettings as PrivacySettingsView } from "./privacy-settings";

const DEFAULTS: PrivacySettings = {
  profile_visibility: "public",
  activity_status: "everyone",
  leaderboard_display: "name",
};

/** Backend giả theo hợp đồng thật: PUT chỉ ghi các khoá đã biết, GET trả đủ ba khoá. */
function installFakeBackend(initial: PrivacySettings = DEFAULTS) {
  const stored: PrivacySettings = { ...initial };
  const known = Object.keys(DEFAULTS) as (keyof PrivacySettings)[];
  const put = vi.fn(async (data: Partial<PrivacySettings>) => {
    for (const key of known) {
      const value = (data as Record<string, string | undefined>)[key];
      if (value !== undefined) stored[key] = value;
    }
    return { message: "ok", data: { ...stored } };
  });
  vi.spyOn(userPreferenceService, "getPrivacySettings").mockImplementation(async () => ({ ...stored }));
  vi.spyOn(userPreferenceService, "updatePrivacySettings").mockImplementation(put);
  return { put, stored };
}

// Select thứ ba trên trang là "Bảng xếp hạng" (thứ tự trong privacyOptions).
const leaderboardSelect = async () => (await screen.findAllByRole("combobox"))[2] as HTMLSelectElement;

describe("PrivacySettings: bảng xếp hạng dùng field leaderboard_display của backend", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chiều đọc: giá trị backend lưu trong leaderboard_display hiện đúng ở ô chọn", async () => {
    installFakeBackend({ ...DEFAULTS, leaderboard_display: "anonymous" });
    renderWithQuery(<PrivacySettingsView />);
    await waitFor(async () => expect((await leaderboardSelect()).value).toBe("anonymous"));
  });

  it("chiều ghi: gửi đúng khoá leaderboard_display, không gửi leaderboard_visibility", async () => {
    const { put } = installFakeBackend();
    renderWithQuery(<PrivacySettingsView />);
    fireEvent.change(await leaderboardSelect(), { target: { value: "username" } });

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith({ leaderboard_display: "username" });
    expect(Object.keys(put.mock.calls[0][0])).not.toContain("leaderboard_visibility");
  });

  it("lưu xong, tải lại trang vẫn giữ giá trị", async () => {
    const { stored } = installFakeBackend();
    const first = renderWithQuery(<PrivacySettingsView />);
    fireEvent.change(await leaderboardSelect(), { target: { value: "anonymous" } });
    await waitFor(() => expect(stored.leaderboard_display).toBe("anonymous"));
    first.unmount();

    // "Tải lại": cây React và cache React Query mới, dữ liệu chỉ còn ở backend.
    renderWithQuery(<PrivacySettingsView />);
    await waitFor(async () => expect((await leaderboardSelect()).value).toBe("anonymous"));
  });
});
