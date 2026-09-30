/**
 * useConversationSocket với WebSocket giả: đăng ký đúng kênh, nhận 3 loại event, nối lại khi rớt
 * (kèm trạng thái để UI hiện "Đang kết nối lại"), dừng hẳn khi bị từ chối kênh, dọn khi unmount.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONVERSATION_WS_EVENTS, reconnectDelayMs, useConversationSocket } from "./use-conversation-socket";

class FakeWebSocket {
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];
  readyState = 0;
  sent: Array<{ event: string; payload?: unknown }> = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  close = vi.fn(() => {
    this.readyState = 3;
  });

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }
  emit(event: string, payload?: unknown) {
    this.onmessage?.({ data: JSON.stringify({ event, payload }) });
  }
  drop() {
    this.readyState = 3;
    this.onclose?.();
  }
}

const last = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1];

describe("useConversationSocket", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket);
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "ws://test.local/api/ws");
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("mở kết nối rồi đăng ký ĐÚNG kênh conversation:<id>; status: connecting -> open", () => {
    const { result } = renderHook(() => useConversationSocket("conv-1", {}));
    expect(result.current.status).toBe("connecting");
    expect(last().url).toBe("ws://test.local/api/ws");

    act(() => last().open());

    expect(result.current.status).toBe("open");
    expect(last().sent[0]).toEqual({ event: "subscribe", payload: { channel: "conversation:conv-1" } });
  });

  it("chuyển đúng 3 loại event tới handler tương ứng", () => {
    const onMessage = vi.fn();
    const onEdited = vi.fn();
    const onDeleted = vi.fn();
    renderHook(() => useConversationSocket("conv-1", { onMessage, onEdited, onDeleted }));
    act(() => last().open());

    const m = { id: "m1", content: "chào" };
    act(() => last().emit(CONVERSATION_WS_EVENTS.message, m));
    act(() => last().emit(CONVERSATION_WS_EVENTS.edited, { ...m, content: "sửa" }));
    act(() => last().emit(CONVERSATION_WS_EVENTS.deleted, { message_id: "m1", conversation_id: "conv-1" }));
    act(() => last().emit("pong"));

    expect(onMessage).toHaveBeenCalledWith(m);
    expect(onEdited).toHaveBeenCalledWith({ ...m, content: "sửa" });
    expect(onDeleted).toHaveBeenCalledWith({ message_id: "m1", conversation_id: "conv-1" });
  });

  it("rớt kết nối: status 'reconnecting', nối lại sau backoff, và báo onReconnected để nạp bù tin lỡ", () => {
    const onReconnected = vi.fn();
    const { result } = renderHook(() => useConversationSocket("conv-1", { onReconnected }));
    act(() => last().open());
    expect(onReconnected).not.toHaveBeenCalled(); // lần nối đầu không phải "nối lại"

    const first = last();
    act(() => first.drop());
    expect(result.current.status).toBe("reconnecting");
    expect(FakeWebSocket.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(reconnectDelayMs(0));
    });
    expect(FakeWebSocket.instances).toHaveLength(2);

    act(() => last().open());
    expect(result.current.status).toBe("open");
    expect(onReconnected).toHaveBeenCalledTimes(1);
    expect(last().sent[0]).toEqual({ event: "subscribe", payload: { channel: "conversation:conv-1" } });
  });

  it("nối lại thất bại liên tiếp: backoff tăng dần, không có giới hạn số lần", () => {
    renderHook(() => useConversationSocket("conv-1", {}));
    act(() => last().open());
    act(() => last().drop());

    for (let attempt = 0; attempt < 8; attempt++) {
      act(() => {
        vi.advanceTimersByTime(reconnectDelayMs(attempt));
      });
      expect(FakeWebSocket.instances).toHaveLength(attempt + 2);
      act(() => last().drop()); // lần nối này cũng hỏng
    }
    expect(reconnectDelayMs(1)).toBeGreaterThan(reconnectDelayMs(0));
    expect(reconnectDelayMs(50)).toBe(30_000);
  });

  it("bị từ chối kênh (subscribe_denied): status 'unavailable' và KHÔNG thử lại", () => {
    const { result } = renderHook(() => useConversationSocket("conv-1", {}));
    act(() => last().open());

    act(() => last().emit("error", { code: "subscribe_denied", message: "Permission denied" }));
    act(() => last().drop());
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(result.current.status).toBe("unavailable");
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("không có URL WebSocket (prod thiếu env): 'unavailable', không tạo kết nối", () => {
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "");
    vi.stubGlobal("location", { ...window.location, hostname: "example.com" });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result } = renderHook(() => useConversationSocket("conv-1", {}));

    expect(result.current.status).toBe("unavailable");
    expect(FakeWebSocket.instances).toHaveLength(0);
    errorSpy.mockRestore();
  });

  it("unmount: huỷ đăng ký kênh, đóng kết nối và không nối lại", () => {
    const { unmount } = renderHook(() => useConversationSocket("conv-1", {}));
    act(() => last().open());
    const socket = last();

    unmount();

    expect(socket.sent.at(-1)).toEqual({ event: "unsubscribe", payload: { channel: "conversation:conv-1" } });
    expect(socket.close).toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("đổi hội thoại: đóng kết nối cũ và đăng ký kênh mới", () => {
    const { rerender } = renderHook(({ id }) => useConversationSocket(id, {}), { initialProps: { id: "a" } });
    act(() => last().open());
    const first = last();

    rerender({ id: "b" });
    act(() => last().open());

    expect(first.close).toHaveBeenCalled();
    expect(last().sent[0]).toEqual({ event: "subscribe", payload: { channel: "conversation:b" } });
  });

  it("gửi ping giữ kết nối mỗi 30 giây", () => {
    renderHook(() => useConversationSocket("conv-1", {}));
    act(() => last().open());

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(last().sent.some((s) => s.event === "ping")).toBe(true);
  });
});
