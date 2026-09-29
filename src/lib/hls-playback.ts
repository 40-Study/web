/**
 * Phát video HLS bằng URL KÝ ngắn hạn (S1, QA 260929).
 *
 * Token đăng nhập của app nằm trong header/body, không phải cookie, nên `<video>` và hls.js không
 * tự gửi được auth. Backend vì thế cấp URL có chữ ký HMAC (query `exp/uid/sig`) trong response nội
 * dung bài học (`video_hls_url`), và `/api/hls/*` chỉ phục vụ URL còn chữ ký hợp lệ — sai/hết hạn
 * trả 403. Module này chỉ chứa phần thuần (không React) để test được.
 */

import type { LessonContent } from "@/services/lesson-content.service";

export const HLS_EXPIRED_MESSAGE =
  "Liên kết video đã hết hạn. Vui lòng tải lại trang để tiếp tục xem.";
export const VIDEO_PROCESSING_MESSAGE =
  "Video đang được xử lý, vui lòng quay lại sau ít phút.";
export const VIDEO_LOAD_FAILED_MESSAGE =
  "Không tải được video. Vui lòng kiểm tra kết nối rồi thử lại.";

/** Chuỗi query (không có `?`) của một URL ký; rỗng nếu URL không có query. */
export function signedQueryOf(url: string | null | undefined): string {
  if (!url) return "";
  const i = url.indexOf("?");
  return i < 0 ? "" : url.slice(i + 1);
}

/** Upload id trong URL dạng `/api/hls/{uuid}/...`; `null` nếu không phải video nội bộ. */
export function extractUploadId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/hls\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return m ? m[1] : null;
}

/**
 * Lỗi hls.js có phải do backend từ chối chữ ký (403) không. hls.js gắn `response.code` vào lỗi
 * mạng của playlist/segment; đây là dấu hiệu duy nhất phân biệt "URL hết hạn" với mất mạng.
 */
export function isHlsAuthFailure(data: { response?: { code?: number } | null } | null | undefined): boolean {
  return data?.response?.code === 403;
}

/** Lỗi phát video cho người dùng — luôn tiếng Việt, không lộ thông điệp kỹ thuật. */
export function playbackErrorMessage(kind: "expired" | "processing" | "failed"): string {
  if (kind === "expired") return HLS_EXPIRED_MESSAGE;
  if (kind === "processing") return VIDEO_PROCESSING_MESSAGE;
  return VIDEO_LOAD_FAILED_MESSAGE;
}

export type VideoSource =
  | { state: "ready"; src: string }
  | { state: "checking" }
  | { state: "processing" }
  | { state: "none" };

/**
 * Chọn nguồn phát từ content do API cấp.
 *
 * - `video_hls_url`: URL HLS ký — nguồn duy nhất học viên/khách được cấp.
 * - `video_url`: CHỈ còn với chủ khoá/admin (file gốc ký) hoặc video ngoài hệ thống (video mẫu).
 *   Học viên không bao giờ nhận file gốc, nên khi HLS chưa xong họ thấy "đang xử lý" chứ không
 *   phát được bản gốc như trước.
 *
 * `hlsReady`: kết quả `/hls/:id/info` — `undefined` = chưa biết (đang kiểm tra).
 */
export function pickVideoSource(
  content: Pick<LessonContent, "video_hls_url" | "video_url"> | undefined,
  hlsReady: boolean | undefined
): VideoSource {
  if (!content) return { state: "none" };
  if (content.video_hls_url) {
    if (hlsReady === undefined) return { state: "checking" };
    if (hlsReady) return { state: "ready", src: content.video_hls_url };
    // HLS chưa xong: chỉ chủ khoá/admin có video_url gốc để xem tạm.
    return content.video_url ? { state: "ready", src: content.video_url } : { state: "processing" };
  }
  return content.video_url ? { state: "ready", src: content.video_url } : { state: "none" };
}
