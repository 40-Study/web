/**
 * Dò xem tài nguyên trong URL có thật không, để middleware trả 404 THẬT (F-08, QA2 261013).
 *
 * Vì sao không dùng `notFound()` trong trang: các `loading.tsx` (root, (main), (app), (lesson))
 * bọc trang trong Suspense nên Next flush shell với status 200 TRƯỚC khi trang kịp chạy;
 * `notFound()` ném sau đó chỉ đổi nội dung + thêm `noindex`, status vẫn 200 (soft 404).
 * Status chỉ đặt được trước khi render — tức ở middleware. Các trang vẫn giữ `notFound()` riêng
 * làm lưới đỡ cho điều hướng client (request RSC không bị dò, xem `shouldProbe`).
 *
 * Đã thử phương án đơn giản hơn trên Next 14.2.20 (review #91, finding 2): gọi `notFound()` trong
 * `generateMetadata` HOẶC trong thân server layout, rồi `next build` + `next start` và `curl`:
 * cả hai đều vẫn trả HTTP 200 (HTML có `NEXT_NOT_FOUND` + `noindex`, tức soft 404) cho
 * /courses/<slug-sai>. Nên middleware vẫn là chỗ duy nhất đặt được 404 thật — giữ probe, nhưng
 * rẻ: timeout ngắn, chỉ coi 404 (và 400 id quiz sai định dạng) là "thiếu", chỉ log một lần.
 *
 * Quy tắc an toàn: CHỈ phản hồi "thiếu" khi backend nói rõ (404, hoặc 400 với id sai định dạng
 * ở quiz). Backend chết/5xx/401/403 -> coi như không biết, để trang tự xử lý như trước.
 */
import type { NextRequest } from "next/server";
import { getPublicApiBaseUrl } from "@/lib/server-fetchers/base-url";

/** Đường dẫn chắc chắn không khớp route nào: Next render app/not-found.tsx với HTTP 404. */
export const MISSING_RESOURCE_REWRITE_PATH = "/__missing-resource__";

/**
 * Probe nằm TRƯỚC TTFB của mọi lần tải trang khoá học/bài học/quiz, nên ngân sách chờ phải nhỏ:
 * quá hạn thì coi như "không biết" và để trang tự xử lý. (Backend không có endpoint "tồn tại?"
 * nhẹ hơn `/courses/slug/:slug`; thêm endpoint đó là việc của lane backend.)
 */
export const PROBE_TIMEOUT_MS = 400;

// Backend chết thì MỌI request trang đều hỏng probe; chỉ log lần đầu để khỏi ngập log. Biến theo
// vòng đời isolate của middleware, đủ để lộ sự cố mà không lặp.
let hasWarnedProbeFailure = false;

interface ProbeRule {
  /** Khớp pathname; nhóm bắt đầu tiên là định danh tài nguyên. */
  pattern: RegExp;
  endpoint: (resourceId: string) => string;
  /** Endpoint cần phiên đăng nhập: chuyển tiếp cookie, không có cookie thì bỏ qua. */
  requiresSession: boolean;
  /** Status backend được hiểu là "không có tài nguyên này". */
  missingStatuses: readonly number[];
}

const PROBE_RULES: readonly ProbeRule[] = [
  {
    // Chi tiết khoá học (công khai). Không khớp /courses/<slug>/learn|exercises.
    pattern: /^\/courses\/([^/]+)\/?$/,
    endpoint: (slug) => `/courses/slug/${slug}`,
    requiresSession: false,
    missingStatuses: [404],
  },
  {
    // Trang học: slug khoá học sai thì chắc chắn 404. (Bài học sai trong khoá đúng cần
    // phiên + ghi danh để biết, do trang tự xử lý bằng notFound() phía client.)
    pattern: /^\/learn\/([^/]+)\/[^/]+\/?$/,
    endpoint: (slug) => `/courses/slug/${slug}`,
    requiresSession: false,
    missingStatuses: [404],
  },
  {
    // Quiz độc lập. Backend trả 400 cho id không phải UUID, 404 cho UUID không có.
    pattern: /^\/quizzes\/([^/]+)\/?$/,
    endpoint: (id) => `/quizzes/${id}`,
    requiresSession: true,
    missingStatuses: [400, 404],
  },
];

interface ProbeOptions {
  fetchImpl?: typeof fetch;
  apiBaseUrl?: string;
}

/**
 * Chỉ dò request tải trang (document). Request RSC (điều hướng client) và prefetch của
 * `<Link>` bỏ qua: prefetch cả trang danh mục sẽ bắn hàng chục lượt gọi backend vô ích.
 */
function shouldProbe(request: NextRequest): boolean {
  return !request.headers.get("rsc") && !request.headers.get("next-router-prefetch");
}

function matchRule(pathname: string): { rule: ProbeRule; resourceId: string } | null {
  for (const rule of PROBE_RULES) {
    const match = pathname.match(rule.pattern);
    if (match?.[1]) return { rule, resourceId: match[1] };
  }
  return null;
}

/** `true` chỉ khi backend khẳng định tài nguyên trong URL không tồn tại. */
export async function isMissingResource(
  request: NextRequest,
  { fetchImpl = fetch, apiBaseUrl = getPublicApiBaseUrl() }: ProbeOptions = {}
): Promise<boolean> {
  if (!shouldProbe(request)) return false;

  const matched = matchRule(request.nextUrl.pathname);
  if (!matched) return false;

  const headers: Record<string, string> = {};
  if (matched.rule.requiresSession) {
    const cookie = request.headers.get("cookie");
    if (!cookie) return false;
    headers.cookie = cookie;
  }

  try {
    const response = await fetchImpl(`${apiBaseUrl}${matched.rule.endpoint(matched.resourceId)}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return matched.rule.missingStatuses.includes(response.status);
  } catch (error) {
    // Không chặn trang vì sự cố của lớp dò, nhưng phải để lại dấu vết (không nuốt lỗi im lặng) — một lần.
    if (!hasWarnedProbeFailure) {
      hasWarnedProbeFailure = true;
      console.warn(
        `[middleware] không dò được ${request.nextUrl.pathname} (sẽ không log lại các lần sau) — trang tự xử lý not-found:`,
        error instanceof Error ? error.message : error
      );
    }
    return false;
  }
}
