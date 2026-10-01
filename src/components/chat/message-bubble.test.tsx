/**
 * E2E 01/10 F4: chat nhóm hiện `user_name` (vd "student2") trong khi danh sách thành viên hiện họ tên
 * ("Phạm Thị D"). Tên người gửi phải theo cùng thứ tự: full_name, rơi về user_name, cuối cùng là "Học viên".
 * Tin realtime qua WebSocket đi cùng đường render này (payload `conversation_message` là một `Message`).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Message } from "@/services/conversation.service";
import { MessageBubble, senderDisplayName } from "./message-bubble";

const base: Message = {
  id: "m1",
  conversation_id: "c1",
  sender_id: "u2",
  sender_name: "student2",
  type: "TEXT",
  content: "xin chào",
  status: "SENT",
  is_edited: false,
  is_pinned: false,
  created_at: "2026-10-01T10:00:00Z",
};

describe("senderDisplayName", () => {
  it("ưu tiên họ tên", () => {
    expect(senderDisplayName({ ...base, sender_full_name: "Phạm Thị D" })).toBe("Phạm Thị D");
  });

  it("chưa có họ tên (vắng, rỗng, toàn khoảng trắng) thì rơi về user_name", () => {
    for (const full of [undefined, "", "   "]) {
      expect(senderDisplayName({ ...base, sender_full_name: full })).toBe("student2");
    }
  });

  it("không có cả hai thì 'Học viên', không để ô tên trống", () => {
    expect(senderDisplayName({ ...base, sender_name: "", sender_full_name: undefined })).toBe("Học viên");
    expect(senderDisplayName({ ...base, sender_name: "  ", sender_full_name: " " })).toBe("Học viên");
  });
});

describe("MessageBubble — tên người gửi", () => {
  it("tin của người khác hiện họ tên, không hiện user_name", () => {
    render(<MessageBubble message={{ ...base, sender_full_name: "Phạm Thị D" }} isOwn={false} />);
    expect(screen.getByText("Phạm Thị D")).toBeTruthy();
    expect(screen.queryByText("student2")).toBeNull();
  });

  it("payload cũ chưa có họ tên vẫn hiện user_name", () => {
    render(<MessageBubble message={base} isOwn={false} />);
    expect(screen.getByText("student2")).toBeTruthy();
  });

  it("tin của chính mình không hiện nhãn tên", () => {
    render(<MessageBubble message={{ ...base, sender_full_name: "Phạm Thị D" }} isOwn />);
    expect(screen.queryByText("Phạm Thị D")).toBeNull();
  });
});
