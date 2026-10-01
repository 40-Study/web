/**
 * Realtime tin nhắn của MỘT hội thoại (chat nhóm, DM) qua WebSocket của backend.
 *
 * Giao thức (backend/internal/socket): gửi `{event:"subscribe", payload:{channel:"conversation:<id>"}}`
 * sau khi mở kết nối; backend phát các event ở `CONVERSATION_WS_EVENTS` lên kênh đó. Authorizer phía
 * backend chỉ cho participant còn hiệu lực đăng ký kênh — người ngoài nhận `error` `subscribe_denied`.
 *
 * Mất kết nối KHÔNG làm chat chết: hook tự nối lại (backoff, không giới hạn số lần) và báo
 * `status = "reconnecting"`; trong lúc đó component gọi phải bật tải lại định kỳ (`useMessages`
 * `refetchInterval`) để không lỡ tin. Khi nối lại được, `onReconnected` cho phép nạp bù ngay.
 */

import { useEffect, useRef, useState } from "react";
import { getWsUrl } from "@/lib/ws-url";
import type { Message } from "@/services/conversation.service";

/** Tên event backend phát lên kênh `conversation:<id>` (internal/socket/types.go). */
export const CONVERSATION_WS_EVENTS = {
  message: "conversation_message",
  edited: "message_edited",
  deleted: "message_deleted",
  /**
   * Chặn/bỏ chặn làm khoá của một DM đổi. Backend gửi tới kênh `user:<id>` (tự đăng ký khi nối), không phải kênh
   * `conversation:<id>`, nên về cùng kết nối này và có thể thuộc DM khác DM đang mở: nơi gọi phải so `conversation_id`.
   */
  blockedChanged: "conversation_blocked_changed",
} as const;

/** Payload `conversation_blocked_changed`: giống hệt nhau ở hai phía, KHÔNG nói ai chặn ai. */
export interface ConversationBlockedChangedPayload {
  conversation_id: string;
  is_blocked: boolean;
}

/**
 * - `connecting`: đang mở kết nối lần đầu.
 * - `open`: đã đăng ký kênh, tin mới về tức thì.
 * - `reconnecting`: đã từng nối được nhưng vừa rớt; đang thử lại (UI hiện "Đang kết nối lại").
 * - `unavailable`: không có URL WS hoặc bị từ chối kênh; chỉ còn tải lại định kỳ, không thử lại.
 */
export type ConversationSocketStatus = "connecting" | "open" | "reconnecting" | "unavailable";

export interface ConversationSocketHandlers {
  onMessage?: (message: Message) => void;
  onEdited?: (message: Message) => void;
  onDeleted?: (payload: { message_id: string; conversation_id: string }) => void;
  onBlockedChanged?: (payload: ConversationBlockedChangedPayload) => void;
  /** Gọi mỗi lần nối lại thành công sau khi rớt — nơi gọi nạp bù tin đã lỡ. */
  onReconnected?: () => void;
}

const PING_INTERVAL_MS = 30_000;
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

export function reconnectDelayMs(attempt: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_MAX_MS);
}

export function useConversationSocket(
  conversationId: string | null,
  handlers: ConversationSocketHandlers
): { status: ConversationSocketStatus } {
  const [status, setStatus] = useState<ConversationSocketStatus>("connecting");
  // Handler đổi mỗi lần render; giữ trong ref để không phải đóng/mở lại kết nối.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!conversationId) return;

    const url = getWsUrl();
    if (!url || typeof WebSocket === "undefined") {
      setStatus("unavailable");
      return;
    }

    let disposed = false;
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let attempt = 0;
    let hasBeenOpen = false;
    const channel = `conversation:${conversationId}`;

    const clearTimers = () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (pingTimer) clearInterval(pingTimer);
      retryTimer = null;
      pingTimer = null;
    };

    const scheduleReconnect = () => {
      if (disposed) return;
      setStatus(hasBeenOpen ? "reconnecting" : "connecting");
      retryTimer = setTimeout(connect, reconnectDelayMs(attempt));
      attempt += 1;
    };

    function connect() {
      if (disposed) return;
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }
      const socket = ws;

      socket.onopen = () => {
        socket.send(JSON.stringify({ event: "subscribe", payload: { channel } }));
        const wasReconnect = hasBeenOpen;
        hasBeenOpen = true;
        attempt = 0;
        setStatus("open");
        if (wasReconnect) handlersRef.current.onReconnected?.();
        pingTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ event: "ping" }));
        }, PING_INTERVAL_MS);
      };

      socket.onmessage = (ev) => {
        let msg: { event?: string; payload?: unknown };
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        const h = handlersRef.current;
        switch (msg.event) {
          case CONVERSATION_WS_EVENTS.message:
            h.onMessage?.(msg.payload as Message);
            break;
          case CONVERSATION_WS_EVENTS.edited:
            h.onEdited?.(msg.payload as Message);
            break;
          case CONVERSATION_WS_EVENTS.deleted:
            h.onDeleted?.(msg.payload as { message_id: string; conversation_id: string });
            break;
          case CONVERSATION_WS_EVENTS.blockedChanged:
            h.onBlockedChanged?.(msg.payload as ConversationBlockedChangedPayload);
            break;
          case "error": {
            // Bị từ chối kênh (không còn là participant): thử lại vô ích, chỉ còn polling.
            const code = (msg.payload as { code?: string } | undefined)?.code;
            if (code === "subscribe_denied") {
              disposed = true;
              clearTimers();
              setStatus("unavailable");
              socket.close(1000, "subscribe denied");
            }
            break;
          }
          default:
            break;
        }
      };

      socket.onclose = () => {
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = null;
        if (!disposed) scheduleReconnect();
      };

      // onerror luôn kéo theo onclose, nên việc nối lại nằm ở onclose.
      socket.onerror = () => undefined;
    }

    connect();

    return () => {
      disposed = true;
      clearTimers();
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: "unsubscribe", payload: { channel } }));
        }
        ws.close(1000, "component unmounted");
      }
    };
  }, [conversationId]);

  return { status };
}
