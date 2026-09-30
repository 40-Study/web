/**
 * ConversationChat: tin mới về qua WebSocket hiện ngay không cần gọi lại API; mất WebSocket thì hiện
 * "Đang kết nối lại" và tự tải lại định kỳ; khi WS đang mở thì KHÔNG polling.
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import type { ConversationSocketHandlers, ConversationSocketStatus } from "@/hooks/use-conversation-socket";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

// Điều khiển status và bắt handler mà component đăng ký, thay cho WebSocket thật.
const socket = vi.hoisted(() => ({
  status: "open" as ConversationSocketStatus,
  handlers: {} as ConversationSocketHandlers,
}));
vi.mock("@/hooks/use-conversation-socket", () => ({
  useConversationSocket: (_id: string, handlers: ConversationSocketHandlers) => {
    socket.handlers = handlers;
    return { status: socket.status };
  },
}));

import { conversationService, type Message } from "@/services/conversation.service";
import { CHAT_FALLBACK_POLL_MS, ConversationChat } from "./conversation-chat";

const msg = (id: string, content: string, sender = "u-other"): Message => ({
  id,
  conversation_id: "c1",
  sender_id: sender,
  sender_name: sender === "me" ? "Tôi" : "Lan",
  type: "TEXT",
  content,
  status: "SENT",
  is_edited: false,
  is_pinned: false,
  created_at: "2026-09-30T10:00:00Z",
});

describe("ConversationChat", () => {
  beforeEach(() => {
    socket.status = "open";
    vi.spyOn(conversationService, "markAsRead").mockResolvedValue({});
    // API trả tin mới nhất trước.
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({
      messages: [msg("m2", "tin thứ hai"), msg("m1", "tin đầu tiên")],
      total_count: 2,
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("hiện tin theo thứ tự cũ -> mới", async () => {
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);

    await screen.findByText("tin thứ hai");
    const texts = screen.getAllByText(/^tin /).map((n) => n.textContent);
    expect(texts).toEqual(["tin đầu tiên", "tin thứ hai"]);
  });

  it("tin mới qua WebSocket hiện ngay, không gọi lại API", async () => {
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");
    expect(conversationService.getMessages).toHaveBeenCalledTimes(1);

    act(() => socket.handlers.onMessage?.(msg("m3", "tin realtime")));

    expect(await screen.findByText("tin realtime")).toBeTruthy();
    expect(conversationService.getMessages).toHaveBeenCalledTimes(1);
  });

  it("tin sửa và tin xoá qua WebSocket cập nhật khung chat", async () => {
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    act(() => socket.handlers.onEdited?.({ ...msg("m1", "tin đã sửa"), is_edited: true }));
    expect(await screen.findByText(/tin đã sửa/)).toBeTruthy();
    expect(screen.queryByText("tin đầu tiên")).toBeNull();

    act(() => socket.handlers.onDeleted?.({ message_id: "m2", conversation_id: "c1" }));
    await waitFor(() => expect(screen.queryByText("tin thứ hai")).toBeNull());
  });

  it("WebSocket đang mở: không có banner và KHÔNG polling", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_MS * 3);
    });

    expect(screen.queryByText(/Đang kết nối lại/)).toBeNull();
    expect(conversationService.getMessages).toHaveBeenCalledTimes(1);
  });

  it("mất WebSocket: hiện 'Đang kết nối lại' và tự tải lại định kỳ", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    socket.status = "reconnecting";
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    expect(screen.getByRole("status").textContent).toMatch(/Đang kết nối lại/);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_MS + 500);
    });

    expect(vi.mocked(conversationService.getMessages).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("WebSocket không khả dụng (bị từ chối kênh / thiếu URL): vẫn polling, không hiện banner lừa", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    socket.status = "unavailable";
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_MS + 500);
    });

    expect(screen.queryByText(/Đang kết nối lại/)).toBeNull();
    expect(vi.mocked(conversationService.getMessages).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("gửi tin: Enter gọi sendMessage với nội dung đã trim và xoá ô nhập", async () => {
    const send = vi.spyOn(conversationService, "sendMessage").mockResolvedValue(msg("m9", "xin chào", "me"));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    const input = screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  xin chào  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(send).toHaveBeenCalledWith("c1", { content: "xin chào" }));
    expect(input.value).toBe("");
  });

  it("nút Gửi khoá khi ô nhập trống", async () => {
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    expect((screen.getByRole("button", { name: "Gửi tin nhắn" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("tải tin lỗi và chưa có gì để hiển thị: hiện lỗi + Thử lại, không phải khung trống", async () => {
    vi.spyOn(conversationService, "getMessages").mockRejectedValue(new ApiError(500, "UNKNOWN", "boom"));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);

    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
    expect(screen.queryByText(/Chưa có tin nhắn nào/)).toBeNull();
  });

  it("hội thoại chưa có tin: gợi ý gửi lời chào", async () => {
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({ messages: [], total_count: 0 });
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);

    expect(await screen.findByText(/Chưa có tin nhắn nào/)).toBeTruthy();
  });
});
