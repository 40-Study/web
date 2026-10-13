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

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Cookie phiên (`accessToken`/`rfToken`) gắn với HOST của trang, mà WebSocket đi thẳng tới backend chứ không qua
 * proxy same-origin. Nếu env trỏ `127.0.0.1` còn trang mở ở `localhost` (hai bí danh loopback), trình duyệt
 * không gửi cookie -> handshake 401 và realtime không bao giờ chạy (QA vòng 2 F-01). Chỉ khi CẢ HAI đều là
 * loopback mới đổi host của WS theo trang; host thật (api.fortex.ai.vn...) giữ nguyên.
 */
export function alignLoopbackHost(wsUrl: string, pageHostname: string): string {
  let parsed: URL;
  try {
    parsed = new URL(wsUrl);
  } catch {
    return wsUrl;
  }
  const page = pageHostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(parsed.hostname) || !LOOPBACK_HOSTS.has(page) || parsed.hostname === page) {
    return wsUrl;
  }
  parsed.hostname = page;
  return parsed.toString();
}

function resolveConfiguredWsUrl(): string | null {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  // Không có WS env riêng: suy từ API URL để theo đúng backend (dev 5001, prod api.fortex.ai.vn).
  return deriveWsUrlFromApi(process.env.NEXT_PUBLIC_API_URL, window.location);
}

export function getWsUrl(): string {
  if (typeof window === "undefined") return "";

  const configured = resolveConfiguredWsUrl();
  if (configured) {
    const pageHostname = window.location.hostname;
    const aligned = pageHostname ? alignLoopbackHost(configured, pageHostname) : configured;
    if (aligned !== configured) {
      // Đổi host là có chủ đích và phải nhìn thấy được, không im lặng (kèm cách sửa cấu hình gốc).
      console.warn(
        `[WS] ${configured} khác host trang (${pageHostname}) nên cookie phiên không được gửi kèm; ` +
          `đã dùng ${aligned}. Đặt NEXT_PUBLIC_API_URL/NEXT_PUBLIC_WS_URL cùng host với trang (vd localhost).`
      );
    }
    return aligned;
  }

  // Không suy được (thiếu cả NEXT_PUBLIC_WS_URL lẫn NEXT_PUBLIC_API_URL) — báo rõ thay vì
  // âm thầm dùng một URL chắc chắn treo như fallback port 5000 cũ.
  console.error(
    "[WS] Không suy được URL WebSocket — cần NEXT_PUBLIC_WS_URL hoặc NEXT_PUBLIC_API_URL. " +
      "Realtime sẽ không hoạt động."
  );
  return "";
}
