import { describe, expect, it } from "vitest";
import type { Message } from "@/services/conversation.service";
import { prependMessage, removeMessage, replaceMessage, type MessageListData } from "./message-cache";

const msg = (id: string, content = id): Message => ({
  id,
  conversation_id: "c1",
  sender_id: "u1",
  sender_name: "An",
  type: "TEXT",
  content,
  status: "SENT",
  is_edited: false,
  is_pinned: false,
  created_at: "2026-09-30T10:00:00Z",
});

const data = (...ids: string[]): MessageListData => ({ messages: ids.map((i) => msg(i)), total_count: ids.length });

describe("message-cache (API trả tin mới nhất trước)", () => {
  it("prepend: tin mới nằm đầu mảng và tăng total_count", () => {
    const next = prependMessage(data("b", "a"), msg("c"))!;
    expect(next.messages.map((m) => m.id)).toEqual(["c", "b", "a"]);
    expect(next.total_count).toBe(3);
  });

  it("prepend: tin đã có (tự gửi về cả HTTP lẫn WS) không bị nhân đôi, giữ nguyên tham chiếu", () => {
    const d = data("b", "a");
    expect(prependMessage(d, msg("b"))).toBe(d);
  });

  it("prepend: chưa có cache thì để nguyên (không tự dựng danh sách từ một tin)", () => {
    expect(prependMessage(undefined, msg("a"))).toBeUndefined();
  });

  it("replace: thay tin đã sửa tại chỗ, tin lạ thì bỏ qua", () => {
    const d = data("b", "a");
    const next = replaceMessage(d, { ...msg("a"), content: "đã sửa", is_edited: true })!;
    expect(next.messages.map((m) => m.content)).toEqual(["b", "đã sửa"]);
    expect(replaceMessage(d, msg("zzz"))).toBe(d);
  });

  it("remove: xoá tin và giảm total_count, tin lạ thì bỏ qua", () => {
    const d = data("b", "a");
    const next = removeMessage(d, "b")!;
    expect(next.messages.map((m) => m.id)).toEqual(["a"]);
    expect(next.total_count).toBe(1);
    expect(removeMessage(d, "zzz")).toBe(d);
  });
});
