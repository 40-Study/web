import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/** Q5-T01: "Chỉnh sửa hồ sơ" dẫn tới /settings?section=profile: trang phải mở đúng mục. */
vi.mock("@/components/settings", () => ({
  SettingsSidebar: ({ activeSection }: { activeSection: string }) => <div data-testid="active">{activeSection}</div>,
  AccountSettings: () => null,
  ProfileSettings: () => null,
  NotificationSettings: () => null,
  AppearanceSettings: () => null,
  PrivacySettings: () => null,
  DevicesSettings: () => null,
  LinkedAccountsSettings: () => null,
}));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ user: { email: "a@b.c" } }) }));
vi.mock("@/hooks/queries/use-auth", () => ({
  useMe: () => ({ data: undefined }),
  useChangePassword: () => ({ mutateAsync: vi.fn() }),
  useDeleteAccount: () => ({ mutateAsync: vi.fn() }),
  useSwitchRole: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/services/auth.service", () => ({ getDeviceInfo: () => ({}) }));
vi.mock("@/lib/appearance-storage", () => ({
  appearanceStorage: {
    getTheme: () => "light", getFontSize: () => 100, getLanguage: () => "vi",
    setTheme: vi.fn(), setFontSize: vi.fn(), setLanguage: vi.fn(),
  },
}));

import SettingsPage from "./page";

afterEach(() => window.history.replaceState({}, "", "/"));

describe("/settings — liên kết sâu ?section=", () => {
  it("?section=profile mở mục Hồ sơ", async () => {
    window.history.replaceState({}, "", "/settings?section=profile");
    render(<SettingsPage />);
    expect((await screen.findByTestId("active")).textContent).toBe("profile");
  });

  it("không có tham số, hoặc giá trị lạ, ở lại mục Tài khoản", () => {
    window.history.replaceState({}, "", "/settings?section=nope");
    render(<SettingsPage />);
    expect(screen.getByTestId("active").textContent).toBe("account");
  });
});
