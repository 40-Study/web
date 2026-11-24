/**
 * Review #125 (Q4-T19): khung giảng viên chỉ cho trang ứng dụng đã đăng nhập. (app) bật `allowTeacherFrame` (kể cả
 * nhánh "public" /profile/<id>), (main) — trang công khai /courses, /help, /terms... — thì không.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("@/components/layout/app-shell-layout", () => ({
  AppShellLayout: ({ children, allowTeacherFrame }: { children: React.ReactNode; allowTeacherFrame?: boolean }) => (
    <div data-testid="shell" data-teacher-frame={String(Boolean(allowTeacherFrame))}>
      {children}
    </div>
  ),
}));

// eslint-disable-next-line import/first
import AppLayout from "./layout";
// eslint-disable-next-line import/first
import MainLayout from "../(main)/layout";

function asTeacher(path: string) {
  vi.mocked(usePathname).mockReturnValue(path);
  useAuthStore.setState({ isAuthenticated: true, activeRole: "TEACHER", hasHydrated: true, sessionStatus: "authenticated" });
}

describe("layout nào được dùng khung giảng viên", () => {
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, hasHydrated: false, sessionStatus: "checking" });
  });

  it.each(["/notifications", "/profile/t-1"])("(app) %s: bật khung giảng viên", (path) => {
    asTeacher(path);
    render(<AppLayout>x</AppLayout>);
    expect(screen.getByTestId("shell").getAttribute("data-teacher-frame")).toBe("true");
  });

  it("(main) trang công khai: không bật khung giảng viên", () => {
    asTeacher("/courses");
    render(<MainLayout>x</MainLayout>);
    expect(screen.getByTestId("shell").getAttribute("data-teacher-frame")).toBe("false");
  });
});
