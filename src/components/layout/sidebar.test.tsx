/**
 * QA 260927 M-19/S-P1-4/H8 — sidebar menu data-driven theo role.
 *
 * Proves: phụ huynh KHÔNG thấy Cuộc thi/Nhóm/Xu/Bạn bè/AI Chat, học sinh vẫn
 * thấy đủ; "Gia đình" đổi nhãn "Con của tôi" khi xem bằng vai phụ huynh; mục
 * "Bạn bè"/"AI Chat" đã bỏ khỏi menu MỌI vai trò (không chỉ phụ huynh).
 *
 * Dự án chưa cài `@testing-library/jest-dom` (không có trong `vitest.setup.ts`),
 * nên dùng thẳng `queryByText`/`getByText` trả về `null` hay `HTMLElement`
 * thay vì matcher `toBeInTheDocument()`.
 */

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Sidebar } from "./sidebar";
import { useAuthStore } from "@/stores/auth.store";

function setRole(role: string | null, isAuthenticated: boolean) {
  useAuthStore.setState({ isAuthenticated, activeRole: role });
}

describe("Sidebar — menu data-driven theo role", () => {
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null });
  });

  it("phụ huynh: ẩn Cuộc thi/Nhóm/Xu/Bạn bè/AI Chat, nhãn Gia đình -> Con của tôi", () => {
    setRole("PARENT", true);
    render(<Sidebar />);

    expect(screen.getByText("Con của tôi")).toBeTruthy();
    expect(screen.queryByText("Gia đình")).toBeNull();
    expect(screen.queryByText("Cuộc thi")).toBeNull();
    expect(screen.queryByText("Nhóm")).toBeNull();
    expect(screen.queryByText("Xu")).toBeNull();
    expect(screen.queryByText("Bạn bè")).toBeNull();
    expect(screen.queryByText("AI Chat")).toBeNull();
    // Vẫn giữ những mục dùng chung
    expect(screen.getByText("Tin nhắn")).toBeTruthy();
    expect(screen.getByText("Trang chủ")).toBeTruthy();
    expect(screen.getByText("Khám phá")).toBeTruthy();
  });

  it("học sinh: vẫn thấy Cuộc thi/Nhóm/Xu, nhưng KHÔNG còn Bạn bè/AI Chat", () => {
    setRole("STUDENT", true);
    render(<Sidebar />);

    expect(screen.getByText("Gia đình")).toBeTruthy();
    expect(screen.queryByText("Con của tôi")).toBeNull();
    expect(screen.getByText("Cuộc thi")).toBeTruthy();
    expect(screen.getByText("Nhóm")).toBeTruthy();
    expect(screen.getByText("Xu")).toBeTruthy();
    // S-P1-4: bỏ hẳn khỏi menu mọi vai trò, không riêng phụ huynh
    expect(screen.queryByText("Bạn bè")).toBeNull();
    // H8: sản phẩm không làm AI
    expect(screen.queryByText("AI Chat")).toBeNull();
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
