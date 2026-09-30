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
const summary = vi.hoisted(() => ({ incoming: 0 }));
vi.mock("@/hooks/queries/use-friends", () => ({
  useFriendSummary: () => ({ data: { friends_count: 0, incoming_requests: summary.incoming, outgoing_requests: 0 } }),
}));

function setRole(role: string | null, isAuthenticated: boolean) {
  useAuthStore.setState({ isAuthenticated, activeRole: role });
}

describe("Sidebar — menu data-driven theo role", () => {
  beforeEach(() => {
    summary.incoming = 0;
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
