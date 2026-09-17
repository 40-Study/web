/**
 * Video upload service — chunked upload with presigned URLs
 * Endpoints: /videos/upload/*, /videos/health, /videos/processing/queue
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface InitUploadDTO {
  resource_id: string;
  resource_type: string;
  original_file_name: string;
  content_type: string;
  file_size: number;
  chunk_size: number;
}

export interface InitUploadResponse {
  upload_id: string;
  chunk_count: number;
  chunk_size: number;
}

export interface PresignedUrlsDTO {
  upload_id: string;
  chunk_numbers: number[];
}

export interface PresignedUrl {
  chunk_number: number;
  url: string;
}

export interface ChunkCompleteDTO {
  upload_id: string;
  chunk_number: number;
  etag: string;
  size: number;
}

export interface UploadStatus {
  upload_id: string;
  status: string;
  progress: number;
  completed_chunks: number;
  total_chunks: number;
}

export interface IncompleteUpload {
  upload_id: string;
  resource_id: string;
  original_file_name: string;
  progress: number;
  created_at: string;
}

/**
 * V-I (re-review vòng 2 web PR #17): trước đây `POST /videos/upload/complete`
 * trả `data: null` — không có cách nào tự động điền URL sau khi upload xong
 * (giáo viên phải tự dán URL, xem `subtitle-upload-field.tsx`). `url` là field
 * MỚI backend bổ sung (phía backend chịu trách nhiệm) để trả về URL công khai
 * của file vừa upload xong; optional vì backend cũ (chưa deploy field này)
 * vẫn phải chạy được — web không được coi thiếu field là lỗi.
 */
export interface CompleteUploadResponse {
  url?: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const videoUploadService = {
  /** GET /videos/health — check video service health (public) */
  health: () =>
    api.get<R<{ status: string }>>("/videos/health").then((r) => r.data.data),

  /** POST /videos/upload/init — initialize chunked upload */
  initUpload: (data: InitUploadDTO) =>
    api.post<R<InitUploadResponse>>("/videos/upload/init", data).then((r) => r.data.data),

  /** POST /videos/upload/presigned-urls — get presigned URLs for chunks */
  getPresignedUrls: (data: PresignedUrlsDTO) =>
    api
      .post<R<{ upload_id: string; urls: PresignedUrl[] }>>("/videos/upload/presigned-urls", data)
      .then((r) => r.data.data.urls),

  /** POST /videos/upload/chunk-complete — mark a chunk as uploaded */
  chunkComplete: (data: ChunkCompleteDTO) =>
    api.post<R<null>>("/videos/upload/chunk-complete", data).then((r) => r.data),

  /**
   * POST /videos/upload/complete — finalize upload.
   *
   * Trả `data.url` khi backend đã bổ sung field này (V-I); `undefined`/thiếu
   * field trên backend cũ vẫn hợp lệ — caller tự quyết định phương án phụ
   * (xem `subtitle-upload-field.tsx`).
   */
  completeUpload: (uploadId: string) =>
    api
      .post<R<CompleteUploadResponse | null>>("/videos/upload/complete", { upload_id: uploadId })
      .then((r) => r.data.data),

  /** GET /videos/upload/:uploadId/status */
  getUploadStatus: (uploadId: string) =>
    api.get<R<UploadStatus>>(`/videos/upload/${uploadId}/status`).then((r) => r.data.data),

  /** GET /videos/upload/:uploadId/resume — resume info */
  getResumeInfo: (uploadId: string) =>
    api.get<R<UploadStatus>>(`/videos/upload/${uploadId}/resume`).then((r) => r.data.data),

  /** GET /videos/upload/incomplete — list incomplete uploads */
  getIncompleteUploads: () =>
    api
      .get<R<IncompleteUpload[]>>("/videos/upload/incomplete")
      .then((r) => r.data.data),

  /** DELETE /videos/upload/:uploadId — cancel/abort upload */
  cancelUpload: (uploadId: string, reason?: string) =>
    api
      .delete<R<null>>(`/videos/upload/${uploadId}`, { data: { reason } })
      .then((r) => r.data),

  /** GET /videos/processing/queue — processing queue status */
  getProcessingQueue: () =>
    api.get<R<unknown[]>>("/videos/processing/queue").then((r) => r.data.data),
};
