/**
 * Q5-T04: gõ từ khoá không khớp cuộc trò chuyện nào từng ra danh sách trắng (không chữ, không gợi ý xoá ô tìm).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ user: { id: "u1" }, activeRole: "STUDENT" }),
}));
vi.mock("@/hooks/queries/use-conversations", () => ({
  useConversations: () => ({
    data: {
      conversations: [
        {
          id: "c1",
          type: "DIRECT",
          name: null,
          unread_count: 0,
          last_message: null,
          last_message_at: null,
          participants: [
            { user_id: "u1", user_name: "Tôi" },
            { user_id: "u2", user_name: "Cô Lan", is_online: false },
          ],
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/components/chat/conversation-chat", () => ({ ConversationChat: () => null }));
vi.mock("./new-conversation-dialog", () => ({ NewConversationDialog: () => null }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("") }));

// eslint-disable-next-line import/first
import MessagesPage from "./page";

const EMPTY_TEXT = "Không tìm thấy cuộc trò chuyện";

describe("Trang Tin nhắn — tìm cuộc trò chuyện (Q5-T04)", () => {
  it("từ khoá không khớp: hiện 'Không tìm thấy cuộc trò chuyện' thay cho danh sách trắng, xoá từ khoá thì danh sách trở lại", () => {
    render(<MessagesPage />);
    const search = screen.getByPlaceholderText(/Tìm cuộc trò chuyện/);

    expect(screen.getByText("Cô Lan")).toBeTruthy();
    expect(screen.queryByText(EMPTY_TEXT)).toBeNull();

    fireEvent.change(search, { target: { value: "zzzz-khong-co" } });
    expect(screen.getByText(EMPTY_TEXT)).toBeTruthy();
    expect(screen.queryByText("Cô Lan")).toBeNull();

    fireEvent.change(search, { target: { value: "" } });
    expect(screen.queryByText(EMPTY_TEXT)).toBeNull();
    expect(screen.getByText("Cô Lan")).toBeTruthy();
  });

  it("từ khoá khớp: giữ nguyên kết quả, không hiện câu rỗng", () => {
    render(<MessagesPage />);
    fireEvent.change(screen.getByPlaceholderText(/Tìm cuộc trò chuyện/), { target: { value: "lan" } });

    expect(screen.getByText("Cô Lan")).toBeTruthy();
    expect(screen.queryByText(EMPTY_TEXT)).toBeNull();
  });

  it("ô tìm có tên truy cập (QA6 S6-07)", () => {
    render(<MessagesPage />);
    expect(screen.getByRole("textbox", { name: "Tìm cuộc trò chuyện" })).toBeTruthy();
  });
});
