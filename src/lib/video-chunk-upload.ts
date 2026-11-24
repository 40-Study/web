/**
 * Q4-T09: PUT từng phần video lên MinIO từng không có giới hạn thời gian. Khi MinIO trả URL nội bộ (thiếu
 * MINIO_PUBLIC_ENDPOINT) trình duyệt treo ở "50%" khoảng 60 giây rồi in nguyên "Failed to fetch" tiếng Anh.
 * Nay mỗi phần có hạn chờ, và mọi lỗi upload được đổi sang câu tiếng Việt trước khi hiện cho giảng viên.
 */
import { getErrorMessage, HAS_VIETNAMESE_DIACRITICS } from "@/lib/error-messages";
import { ApiError } from "@/lib/errors";

/** Một phần 5 MB qua mạng chậm (~1 Mbps) mất khoảng 40 giây; 90 giây để không cắt nhầm upload thật. */
export const CHUNK_UPLOAD_TIMEOUT_MS = 90_000;

export const UPLOAD_TIMEOUT_MESSAGE =
  "Tải video lên quá lâu không phản hồi nên đã dừng. Hãy kiểm tra mạng và thử lại.";
export const UPLOAD_UNREACHABLE_MESSAGE =
  "Không kết nối được máy chủ lưu trữ video. Vui lòng thử lại sau hoặc báo quản trị viên.";
export const UPLOAD_FAILED_MESSAGE = "Tải video lên thất bại. Vui lòng thử lại.";

/** Lỗi đã có câu tiếng Việt dành cho người dùng. */
export class VideoUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoUploadError";
  }
}

/** PUT một phần lên URL ký sẵn, huỷ sau `timeoutMs`. Trả ETag (hoặc chuỗi thay thế khi MinIO không lộ header). */
export async function putVideoChunk(
  url: string,
  chunk: Blob,
  chunkNumber: number,
  timeoutMs: number = CHUNK_UPLOAD_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, { method: "PUT", body: chunk, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) throw new VideoUploadError(UPLOAD_TIMEOUT_MESSAGE);
    throw new VideoUploadError(err instanceof TypeError ? UPLOAD_UNREACHABLE_MESSAGE : UPLOAD_FAILED_MESSAGE);
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new VideoUploadError(`${UPLOAD_FAILED_MESSAGE} (mã ${response.status})`);
  return response.headers.get("ETag") || `"chunk-${chunkNumber}"`;
}

/** Câu tiếng Việt cho bất kỳ lỗi nào trong luồng upload; không bao giờ in chuỗi tiếng Anh thô. */
export function videoUploadErrorMessage(err: unknown): string {
  if (err instanceof VideoUploadError) return err.message;
  if (err instanceof ApiError) return getErrorMessage(err, UPLOAD_FAILED_MESSAGE);
  if (err instanceof TypeError) return UPLOAD_UNREACHABLE_MESSAGE;
  if (err instanceof Error && HAS_VIETNAMESE_DIACRITICS.test(err.message)) return err.message;
  return UPLOAD_FAILED_MESSAGE;
}
