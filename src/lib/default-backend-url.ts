/**
 * URL backend mặc định khi thiếu `NEXT_PUBLIC_API_URL` / `BACKEND_URL` — NGUỒN DUY NHẤT.
 *
 * Backend dev chạy cổng 5001; cổng 5000 trên macOS bị AirPlay Receiver (AirTunes) chiếm và trả 403.
 * Dùng `localhost` (không `127.0.0.1`) để cùng host với trang, cookie phiên mới đi kèm (xem `.env.example`).
 */
export const DEFAULT_BACKEND_ORIGIN = "http://localhost:5001";
export const DEFAULT_API_BASE_URL = `${DEFAULT_BACKEND_ORIGIN}/api`;
