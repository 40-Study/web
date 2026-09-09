/**
 * WebSocket hook for real-time notifications
 * Connects to backend WebSocket endpoint for push notifications
 */

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { notificationKeys } from "./queries/use-notifications";

interface WebSocketMessage {
  event: string;
  payload?: unknown;
}

interface NotificationPayload {
  id: string;
  title: string;
  content: string;
  notification_type: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

// WebSocket URL — H6 fix: prod đi qua Next same-origin proxy (route.ts dùng
// axios, không thể upgrade WebSocket) nên phải trỏ THẲNG backend qua biến
// môi trường NEXT_PUBLIC_WS_URL, không đi qua /api same-origin nữa.
function getWsUrl(): string {
  if (typeof window === "undefined") return "";

  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  // Dev fallback: kết nối thẳng backend local khi chưa cấu hình env.
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "ws://localhost:5000/api/ws";
  }

  // Không có NEXT_PUBLIC_WS_URL ở production — không thể kết nối qua same-origin
  // proxy (route.ts dùng axios, không upgrade WS được). Báo rõ thay vì âm thầm
  // dùng một URL chắc chắn treo.
  console.error(
    "[WS] NEXT_PUBLIC_WS_URL chưa được cấu hình — realtime notification sẽ không hoạt động ở production."
  );
  return "";
}

export function useNotificationSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const handleNotification = useCallback(
    (payload: NotificationPayload) => {
      // Show toast notification with icon based on type
      toast(payload.title, {
        description: payload.content,
        duration: 5000,
        action: payload.reference_type
          ? {
              label: "Xem",
              onClick: () => {
                if (payload.reference_type === "course") {
                  window.location.href = `/courses/${payload.reference_id}`;
                } else if (payload.reference_type === "class") {
                  window.location.href = `/classes/${payload.reference_id}`;
                } else if (payload.reference_type === "assignment") {
                  window.location.href = `/assignments/${payload.reference_id}`;
                }
              },
            }
          : undefined,
      });

      // Invalidate notification queries to refresh the list and count
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    [queryClient]
  );

  const connect = useCallback(() => {
    if (!isAuthenticated || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = getWsUrl();
    if (!wsUrl) return;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WS] Connected to notification socket");
        reconnectAttemptsRef.current = 0;

        // Subscribe to personal notification channel
        ws.send(JSON.stringify({
          event: "subscribe",
          payload: { channel: "notifications" }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.event) {
            case "notification":
              if (message.payload) {
                handleNotification(message.payload as NotificationPayload);
              }
              break;
            case "pong":
              // Heartbeat response
              break;
            default:
              console.log("[WS] Unknown event:", message.event);
          }
        } catch (error) {
          console.error("[WS] Failed to parse message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("[WS] Connection closed:", event.code, event.reason);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (isAuthenticated && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[WS] Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        // Silent error - WebSocket might not be available
        console.log("[WS] Connection error - will retry");
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[WS] Failed to create connection:", error);
    }
  }, [isAuthenticated, handleNotification]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  // Send ping every 30s to keep connection alive
  useEffect(() => {
    if (!wsRef.current) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: "ping" }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, []);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    connect,
    disconnect,
  };
}
