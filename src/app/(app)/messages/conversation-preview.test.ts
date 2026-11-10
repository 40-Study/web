import { describe, expect, it } from "vitest";
import type { Conversation, Message } from "@/services/conversation.service";
import { conversationPreviewText, conversationTimeLabel } from "./conversation-preview";

const conv = (extra: Partial<Conversation>): Conversation =>
  ({
    id: "c1",
    type: "DIRECT",
    message_count: 0,
    unread_count: 0,
    is_muted: false,
    is_pinned: false,
    participants: [],
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...extra,
  }) as Conversation;

describe("conversationPreviewText (QA-B-21)", () => {
  it("có giờ tin cuối mà danh sách không kèm nội dung: không ghi 'Chưa có tin nhắn'", () => {
    expect(conversationPreviewText(conv({ last_message_at: "2026-11-10T05:35:00Z", message_count: 3 }))).toBe(
      "Mở để xem tin nhắn",
    );
  });

  it("hội thoại thật sự chưa có tin", () => {
    expect(conversationPreviewText(conv({}))).toBe("Chưa có tin nhắn");
  });

  it("tin cuối là tệp đính kèm không có chữ", () => {
    const last = { type: "file", content: "" } as Message;
    expect(conversationPreviewText(conv({ last_message: last, last_message_at: "2026-11-10T05:35:00Z" }))).toBe(
      "Đã gửi một tệp đính kèm",
    );
  });

  it("có nội dung thì hiện nội dung", () => {
    const last = { type: "text", content: "Chào thầy" } as Message;
    expect(conversationPreviewText(conv({ last_message: last }))).toBe("Chào thầy");
  });
});

describe("conversationTimeLabel", () => {
  const NOW = new Date("2026-11-10T08:00:00Z"); // 15:00 giờ VN
  it("tin hôm nay hiện giờ VN", () => {
    expect(conversationTimeLabel("2026-11-10T05:35:00Z", NOW)).toBe("12:35");
  });
  it("tin ngày khác hiện ngày", () => {
    expect(conversationTimeLabel("2026-10-02T05:35:00Z", NOW)).toBe("02/10");
  });
});
