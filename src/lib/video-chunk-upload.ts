/**
 * Q4-T09: PUT từng phần video lên MinIO từng không có giới hạn thời gian. Khi MinIO trả URL nội bộ (thiếu
 * MINIO_PUBLIC_ENDPOINT) trình duyệt treo ở "50%" khoảng 60 giây rồi in nguyên "Failed to fetch" tiếng Anh.
 * Nay mỗi phần dừng khi không có tiến độ quá hạn chờ, giảng viên huỷ được, và mọi lỗi upload được đổi sang câu tiếng
 * Việt trước khi hiện cho giảng viên.
 */
import { getErrorMessage, HAS_VIETNAMESE_DIACRITICS } from "@/lib/error-messages";
import { ApiError } from "@/lib/errors";

/**
 * Hạn chờ KHÔNG có tiến độ (không phải hạn cho cả phần): mỗi sự kiện `upload.onprogress` đặt lại đồng hồ, nên mạng
 * chậm nhưng vẫn chạy không bị cắt, còn kết nối treo (URL MinIO nội bộ) dừng sau ~20 giây thay vì ~60 giây.
 */
export const CHUNK_STALL_TIMEOUT_MS = 20_000;

export const UPLOAD_TIMEOUT_MESSAGE =
  "Tải video lên quá lâu không phản hồi nên đã dừng. Hãy kiểm tra mạng và thử lại.";
export const UPLOAD_UNREACHABLE_MESSAGE =
  "Không kết nối được máy chủ lưu trữ video. Vui lòng thử lại sau hoặc báo quản trị viên.";
export const UPLOAD_FAILED_MESSAGE = "Tải video lên thất bại. Vui lòng thử lại.";
export const UPLOAD_CANCELLED_MESSAGE = "Đã huỷ tải lên video.";

/** Lỗi đã có câu tiếng Việt dành cho người dùng. */
export class VideoUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoUploadError";
  }
}

/** Giảng viên bấm "Huỷ tải lên": không phải lỗi, nơi gọi báo nhẹ thay vì toast lỗi. */
export class VideoUploadCancelledError extends VideoUploadError {
  constructor() {
    super(UPLOAD_CANCELLED_MESSAGE);
    this.name = "VideoUploadCancelledError";
  }
}

/** Dừng ngay giữa các bước (xin URL, báo hoàn tất phần) khi giảng viên đã huỷ. */
export function throwIfUploadCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) throw new VideoUploadCancelledError();
}

export interface PutVideoChunkOptions {
  /** Huỷ khi không có tiến độ trong khoảng này (ms). */
  stallTimeoutMs?: number;
  /** Tín hiệu huỷ từ nút "Huỷ tải lên". */
  signal?: AbortSignal;
}

/**
 * PUT một phần lên URL ký sẵn bằng XHR (fetch không báo tiến độ gửi lên). Trả ETag, hoặc chuỗi thay thế khi MinIO
 * không lộ header.
 */
export function putVideoChunk(
  url: string,
  chunk: Blob,
  chunkNumber: number,
  { stallTimeoutMs = CHUNK_STALL_TIMEOUT_MS, signal }: PutVideoChunkOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new VideoUploadCancelledError());
    const xhr = new XMLHttpRequest();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const settle = (done: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onCancel);
      done();
    };
    const stop = (error: VideoUploadError) => {
      settle(() => reject(error));
      xhr.abort();
    };
    const armStallTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => stop(new VideoUploadError(UPLOAD_TIMEOUT_MESSAGE)), stallTimeoutMs);
    };
    const onCancel = () => stop(new VideoUploadCancelledError());

    xhr.upload.onprogress = armStallTimer;
    xhr.onreadystatechange = armStallTimer;
    xhr.onerror = () => settle(() => reject(new VideoUploadError(UPLOAD_UNREACHABLE_MESSAGE)));
    xhr.onload = () =>
      settle(() => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new VideoUploadError(`${UPLOAD_FAILED_MESSAGE} (mã ${xhr.status})`));
          return;
        }
        resolve(xhr.getResponseHeader("ETag") || `"chunk-${chunkNumber}"`);
      });
    signal?.addEventListener("abort", onCancel);
    xhr.open("PUT", url);
    armStallTimer();
    xhr.send(chunk);
  });
}

/** Câu tiếng Việt cho bất kỳ lỗi nào trong luồng upload; không bao giờ in chuỗi tiếng Anh thô. */
export function videoUploadErrorMessage(err: unknown): string {
  if (err instanceof VideoUploadError) return err.message;
  if (err instanceof ApiError) return getErrorMessage(err, UPLOAD_FAILED_MESSAGE);
  if (err instanceof TypeError) return UPLOAD_UNREACHABLE_MESSAGE;
  if (err instanceof Error && HAS_VIETNAMESE_DIACRITICS.test(err.message)) return err.message;
  return UPLOAD_FAILED_MESSAGE;
}
