/**
 * URL WebSocket của backend, dùng chung cho mọi hook realtime (thông báo, chat hội thoại).
 *
 * H6 fix: prod đi qua Next same-origin proxy (route.ts dùng axios, không thể upgrade WebSocket)
 * nên phải trỏ THẲNG backend qua biến môi trường NEXT_PUBLIC_WS_URL, không đi qua /api same-origin.
 *
 * QA S2/P1: fallback hardcode `ws://localhost:5000` khiến realtime chết ở dev — backend dev chạy
 * port 5001, còn cổng 5000 trên macOS là AirTunes/ControlCenter (trả 403). Giờ suy URL WS TỪ
 * `NEXT_PUBLIC_API_URL` (cùng host/port, đổi scheme http→ws / https→wss) để nó luôn bám theo API.
 */

/**
 * Suy URL WebSocket backend (path `/api/ws`) từ URL API đã cấu hình.
 *
 * - `http://host:port/api` -> `ws://host:port/api/ws`
 * - `https://host/api`     -> `wss://host/api/ws`
 * - `/api` (same-origin)   -> `ws(s)://<origin hiện tại>/api/ws`
 *
 * Trả `null` khi không suy được (env rỗng/không hợp lệ, hoặc URL tương đối khi không có `location`).
 */
export function deriveWsUrlFromApi(
  apiUrl: string | null | undefined,
  location?: { protocol: string; host: string } | null
): string | null {
  const raw = (apiUrl ?? "").trim();
  if (!raw) return null;

  // Bỏ dấu `/` cuối để không sinh `//api/ws`.
  const base = raw.replace(/\/+$/, "");

  // URL tương đối (same-origin, vd `/api`) — ghép với origin đang mở trang.
  if (base.startsWith("/")) {
    if (!location) return null;
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    return `${scheme}://${location.host}${base}/ws`;
  }

  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const scheme = parsed.protocol === "https:" ? "wss" : "ws";
  // `new URL` đã chuẩn hoá host (kèm port nếu có) — không tự thêm/xoá port.
  return `${scheme}://${parsed.host}${parsed.pathname.replace(/\/+$/, "")}/ws`;
}

export function getWsUrl(): string {
  if (typeof window === "undefined") return "";

  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  // Không có WS env riêng: suy từ API URL để theo đúng backend (dev 5001, prod api.fortex.ai.vn).
  const derived = deriveWsUrlFromApi(process.env.NEXT_PUBLIC_API_URL, window.location);
  if (derived) return derived;

  // Không suy được (thiếu cả NEXT_PUBLIC_WS_URL lẫn NEXT_PUBLIC_API_URL) — báo rõ thay vì
  // âm thầm dùng một URL chắc chắn treo như fallback port 5000 cũ.
  console.error(
    "[WS] Không suy được URL WebSocket — cần NEXT_PUBLIC_WS_URL hoặc NEXT_PUBLIC_API_URL. " +
      "Realtime sẽ không hoạt động."
  );
  return "";
}
