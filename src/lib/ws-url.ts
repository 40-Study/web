/**
 * URL WebSocket của backend, dùng chung cho mọi hook realtime (thông báo, chat hội thoại).
 *
 * H6 fix: prod đi qua Next same-origin proxy (route.ts dùng axios, không thể upgrade WebSocket)
 * nên phải trỏ THẲNG backend qua biến môi trường NEXT_PUBLIC_WS_URL, không đi qua /api same-origin.
 */
export function getWsUrl(): string {
  if (typeof window === "undefined") return "";

  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  // Dev fallback: kết nối thẳng backend local khi chưa cấu hình env.
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "ws://localhost:5000/api/ws";
  }

  // Không có NEXT_PUBLIC_WS_URL ở production — không thể kết nối qua same-origin proxy (route.ts
  // dùng axios, không upgrade WS được). Báo rõ thay vì âm thầm dùng một URL chắc chắn treo.
  console.error(
    "[WS] NEXT_PUBLIC_WS_URL chưa được cấu hình — realtime sẽ không hoạt động ở production."
  );
  return "";
}
