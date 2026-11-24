/**
 * Q4-T19: giảng viên mở /notifications, /messages, /profile từng rơi vào khung học viên (sidebar thu gọn + footer
 * trang học viên). Vai giảng viên phải dùng khung giảng viên.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const path = vi.hoisted(() => ({ value: "/notifications" }));
vi.mock("next/navigation", () => ({ usePathname: () => path.value }));
vi.mock("./header", () => ({ Header: () => <div data-testid="header" /> }));
vi.mock("./sidebar", () => ({ Sidebar: () => <div data-testid="student-sidebar" /> }));
vi.mock("./teacher-sidebar", () => ({ TeacherSidebar: () => <div data-testid="teacher-sidebar" /> }));
vi.mock("./footer", () => ({ Footer: () => <div data-testid="footer" /> }));
vi.mock("./bottom-nav", () => ({ BottomNav: ({ role }: { role: string }) => <div data-testid={`bottom-nav-${role}`} /> }));

// eslint-disable-next-line import/first
import { AppShellLayout } from "./app-shell-layout";
// eslint-disable-next-line import/first
import { useAuthStore } from "@/stores/auth.store";

describe("AppShellLayout — khung theo vai", () => {
  beforeEach(() => {
    path.value = "/notifications";
  });

  it("giảng viên: sidebar giảng viên, không có footer trang học viên", () => {
    useAuthStore.setState({ isAuthenticated: true, activeRole: "TEACHER" });
    render(<AppShellLayout>nội dung</AppShellLayout>);
    expect(screen.getByTestId("teacher-sidebar")).toBeTruthy();
    expect(screen.getByTestId("bottom-nav-teacher")).toBeTruthy();
    expect(screen.queryByTestId("student-sidebar")).toBeNull();
    expect(screen.queryByTestId("footer")).toBeNull();
    expect(screen.getByText("nội dung")).toBeTruthy();
  });

  it("học viên: giữ khung học viên", () => {
    useAuthStore.setState({ isAuthenticated: true, activeRole: "STUDENT" });
    render(<AppShellLayout>nội dung</AppShellLayout>);
    expect(screen.getByTestId("student-sidebar")).toBeTruthy();
    expect(screen.getByTestId("footer")).toBeTruthy();
    expect(screen.queryByTestId("teacher-sidebar")).toBeNull();
  });
});
