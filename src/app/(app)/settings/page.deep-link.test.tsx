import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Q5-T01: "Chỉnh sửa hồ sơ" dẫn tới /settings?section=profile: trang phải mở đúng mục, và ngay từ lần render
 * đầu (review #127 mục 9: đọc trong effect làm hiện "Tài khoản" một khung hình trước khi nhảy sang "Hồ sơ").
 */
const renderedSections = vi.hoisted(() => [] as string[]);
const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock("@/components/settings", () => ({
  SettingsSidebar: ({ activeSection, onSectionChange }: { activeSection: string; onSectionChange: (s: string) => void }) => {
    renderedSections.push(activeSection);
    return (
      <div>
        <div data-testid="active">{activeSection}</div>
        <button onClick={() => onSectionChange("notifications")}>chon-thong-bao</button>
        <button onClick={() => onSectionChange("account")}>chon-tai-khoan</button>
      </div>
    );
  },
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

afterEach(() => {
  replace.mockReset();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
  renderedSections.length = 0;
});

describe("/settings — liên kết sâu ?section=", () => {
  it("?section=profile mở mục Hồ sơ", async () => {
    window.history.replaceState({}, "", "/settings?section=profile");
    render(<SettingsPage />);
    expect((await screen.findByTestId("active")).textContent).toBe("profile");
    // Không có khung hình nào hiện mục mặc định trước khi sang "profile".
    expect(renderedSections.every((x) => x === "profile")).toBe(true);
  });

  it("không có tham số, hoặc giá trị lạ, ở lại mục Tài khoản", () => {
    window.history.replaceState({}, "", "/settings?section=nope");
    render(<SettingsPage />);
    expect(screen.getByTestId("active").textContent).toBe("account");
  });
});

// Q7-PG-01/02: chọn mục ghi ?section= (tải lại không về "Tài khoản") và, ở màn hẹp, cuộn tới nội dung mục vừa chọn.
describe("/settings — chọn mục", () => {
  it("chọn 'Thông báo' ghi ?section=notifications bằng router.replace; về 'Tài khoản' thì bỏ tham số", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText("chon-thong-bao"));
    expect(screen.getByTestId("active").textContent).toBe("notifications");
    expect(replace).toHaveBeenLastCalledWith("/settings?section=notifications", { scroll: false });
    fireEvent.click(screen.getByText("chon-tai-khoan"));
    expect(replace).toHaveBeenLastCalledWith("/settings", { scroll: false });
  });

  it("dưới md: cuộn khối nội dung vào khung nhìn sau khi chọn; từ md thì không cuộn", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => cb());

    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    render(<SettingsPage />);
    fireEvent.click(screen.getByText("chon-thong-bao"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    scrollIntoView.mockClear();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    fireEvent.click(screen.getByText("chon-tai-khoan"));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
