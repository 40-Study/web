/**
 * useNotificationSocket: đăng xuất phải ĐÓNG HẲN socket, không để nó tự nối lại không có phiên
 * (QA A-15: console báo "WebSocket … Authentication failed" sau khi đăng xuất).
 *
 * FakeWebSocket.close giống trình duyệt thật: gọi `onclose` BẤT ĐỒNG BỘ sau khi đóng. Đó chính là
 * chỗ lỗi cũ nằm: handler onclose (closure sinh lúc còn đăng nhập) lên lịch nối lại sau cả disconnect().
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import { createWrapper } from "@/test-utils/query-wrapper";
import { useNotificationSocket } from "./use-notification-socket";

class FakeWebSocket {
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  send() {}
  close() {
    this.readyState = 3;
    setTimeout(() => this.onclose?.({ code: 1000, reason: "" }), 0);
  }
  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }
}

describe("useNotificationSocket — đăng xuất", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket);
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "ws://test.local/api/ws");
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.useFakeTimers();
    useAuthStore.getState().setSessionStatus("authenticated");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    useAuthStore.getState().reset();
  });

  it("đăng xuất rồi chờ hết thời gian nối lại: KHÔNG mở thêm kết nối nào", () => {
    renderHook(() => useNotificationSocket(), { wrapper: createWrapper() });
    expect(FakeWebSocket.instances).toHaveLength(1);
    act(() => FakeWebSocket.instances[0].open());

    act(() => useAuthStore.getState().setSessionStatus("anonymous"));
    // onclose bất đồng bộ + toàn bộ backoff nối lại (1s…30s) đều phải trôi qua mà không có kết nối mới.
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("còn đăng nhập mà rớt kết nối thì vẫn tự nối lại", () => {
    renderHook(() => useNotificationSocket(), { wrapper: createWrapper() });
    act(() => FakeWebSocket.instances[0].open());

    act(() => FakeWebSocket.instances[0].onclose?.({ code: 1006, reason: "rớt mạng" }));
    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(FakeWebSocket.instances.length).toBeGreaterThan(1);
  });
});