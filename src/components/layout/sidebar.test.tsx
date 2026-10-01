/**
 * QA 260927 M-19/S-P1-4/H8 — sidebar menu data-driven theo role.
 *
 * Proves: phụ huynh KHÔNG thấy Nhóm/Xu/Bạn bè/AI Chat (nhưng thấy Cuộc thi), học sinh vẫn
 * thấy đủ; "Gia đình" đổi nhãn "Con của tôi" khi xem bằng vai phụ huynh; "AI Chat" đã bỏ
 * khỏi menu MỌI vai trò. "Bạn bè" (plans/260930-groups-friends Q1) CHỈ học sinh thấy, kèm badge lời mời chờ.
 *
 * Dự án chưa cài `@testing-library/jest-dom` (không có trong `vitest.setup.ts`),
 * nên dùng thẳng `queryByText`/`getByText` trả về `null` hay `HTMLElement`
 * thay vì matcher `toBeInTheDocument()`.
 */

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";
import { useAuthStore } from "@/stores/auth.store";

// Badge lời mời đọc /friends/summary qua React Query; sidebar test không dựng QueryClientProvider.
const summary = vi.hoisted(() => ({ incoming: 0, enabledCalls: [] as unknown[] }));
vi.mock("@/hooks/queries/use-friends", () => ({
  useFriendSummary: (enabled?: boolean) => (summary.enabledCalls.push(enabled), { data: { friends_count: 0, incoming_requests: summary.incoming, outgoing_requests: 0 } }),
}));

function setRole(role: string | null, isAuthenticated: boolean) {
  useAuthStore.setState({ isAuthenticated, activeRole: role });
}

describe("Sidebar — menu data-driven theo role", () => {
  beforeEach(() => {
    summary.incoming = 0;
    summary.enabledCalls.length = 0;
  });
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null });
  });

  it("phụ huynh: ẩn Nhóm/Xu/Bạn bè/AI Chat, nhãn Gia đình -> Con của tôi", () => {
    setRole("PARENT", true);
    render(<Sidebar />);

    expect(screen.getByText("Con của tôi")).toBeTruthy();
    expect(screen.queryByText("Gia đình")).toBeNull();
    expect(screen.queryByText("Nhóm")).toBeNull();
    expect(screen.queryByText("Xu")).toBeNull();
    expect(screen.queryByText("Bạn bè")).toBeNull();
    expect(screen.queryByText("AI Chat")).toBeNull();
    // Vẫn giữ những mục dùng chung
    expect(screen.getByText("Tin nhắn")).toBeTruthy();
    expect(screen.getByText("Trang chủ")).toBeTruthy();
    expect(screen.getByText("Khám phá")).toBeTruthy();
  });

  it("phụ huynh: THẤY Cuộc thi (xem chỉ đọc, contract cuộc thi §7)", () => {
    setRole("PARENT", true);
    render(<Sidebar />);

    expect(screen.getByText("Cuộc thi")).toBeTruthy();
  });

  it("học sinh: thấy Cuộc thi/Nhóm/Xu/Bạn bè, nhưng KHÔNG có AI Chat", () => {
    setRole("STUDENT", true);
    render(<Sidebar />);

    expect(screen.getByText("Gia đình")).toBeTruthy();
    expect(screen.queryByText("Con của tôi")).toBeNull();
    expect(screen.getByText("Cuộc thi")).toBeTruthy();
    expect(screen.getByText("Nhóm")).toBeTruthy();
    expect(screen.getByText("Xu")).toBeTruthy();
    // Bạn bè đã có backend thật: mục quay lại cho học sinh, trỏ /friends.
    expect(screen.getByText("Bạn bè")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Bạn bè/ }).getAttribute("href")).toBe("/friends");
    // H8: sản phẩm không làm AI
    expect(screen.queryByText("AI Chat")).toBeNull();
  });

  it("học sinh: badge hiện số lời mời kết bạn đang chờ, ẩn khi không có", () => {
    setRole("STUDENT", true);
    const { unmount } = render(<Sidebar />);
    expect(screen.queryByRole("status")).toBeNull();
    unmount();

    summary.incoming = 3;
    render(<Sidebar />);
    expect(screen.getByRole("status", { name: "3 lời mời kết bạn mới" })).toBeTruthy();
  });

  it("mọi vai KHÁC học sinh không thấy Bạn bè (khách, admin)", () => {
    for (const [role, authed] of [[null, false], ["ADMIN", true]] as const) {
      setRole(role, authed);
      const { unmount } = render(<Sidebar />);
      expect(screen.queryByText("Bạn bè")).toBeNull();
      unmount();
    }
  });

  it("TEACHER: ẩn Bạn bè và KHÔNG gọi /friends/summary (query bị tắt)", () => {
    summary.incoming = 3;
    setRole("TEACHER", true);
    render(<Sidebar />);

    expect(screen.queryByText("Bạn bè")).toBeNull();
    expect(screen.queryByRole("status", { name: /lời mời kết bạn/ })).toBeNull();
    expect(summary.enabledCalls.every((e) => e === false)).toBe(true);
  });

  it("STUDENT có vai phụ (PARENT/TEACHER_APPLICANT/ORG_OWNER): vẫn thấy Bạn bè, query bật", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      activeRole: "STUDENT",
      roles: [{ role_name: "STUDENT" }, { role_name: "PARENT" }, { role_name: "TEACHER_APPLICANT" }, { role_name: "ORG_OWNER" }] as never,
    });
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /Bạn bè/ }).getAttribute("href")).toBe("/friends");
    expect(summary.enabledCalls).toContain(true);
    useAuthStore.setState({ roles: [] });
  });

  it("SYSTEM_ADMIN: ẩn Bạn bè", () => {
    setRole("SYSTEM_ADMIN", true);
    render(<Sidebar />);
    expect(screen.queryByText("Bạn bè")).toBeNull();
  });

  it("khách chưa đăng nhập: chỉ thấy mục public, không có Gia đình/Tin nhắn", () => {
    setRole(null, false);
    render(<Sidebar />);

    expect(screen.getByText("Trang chủ")).toBeTruthy();
    expect(screen.getByText("Khám phá")).toBeTruthy();
    expect(screen.getByText("Cuộc thi")).toBeTruthy();
    expect(screen.queryByText("Gia đình")).toBeNull();
    expect(screen.queryByText("Con của tôi")).toBeNull();
    expect(screen.queryByText("Tin nhắn")).toBeNull();
  });
});
