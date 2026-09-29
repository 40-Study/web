"use client";

/**
 * Chọn nguồn phát cho MỘT content video (cửa sổ xem thử ở syllabus và trang quản lý giảng viên).
 *
 * Gộp: upload id + query chữ ký từ `video_hls_url`, trạng thái HLS (`/info`, cũng đòi chữ ký), rồi
 * `pickVideoSource`. Học viên/khách chỉ được cấp URL HLS ký (không có file gốc); chủ khoá/admin còn
 * `video_url` gốc để xem tạm khi HLS chưa xong.
 */

import { useHlsInfo } from "@/hooks/use-hls";
import {
  extractUploadId,
  pickVideoSource,
  signedQueryOf,
  type VideoSource,
} from "@/lib/hls-playback";
import type { LessonContent } from "@/services/lesson-content.service";

export function useLessonVideoSource(
  content: LessonContent | null | undefined,
  enabled: boolean
): { source: VideoSource; src: string | null; isChecking: boolean } {
  const uploadId = extractUploadId(content?.video_hls_url) ?? content?.video_upload_id ?? null;
  const signedQuery = signedQueryOf(content?.video_hls_url);
  const { data: info, isLoading, error } = useHlsInfo(enabled ? uploadId : null, signedQuery);

  const hlsReady = info
    ? info.hls_ready === true || info.status === "ready"
    : error
      ? true // /info lỗi: thử phát thẳng, player tự báo lỗi nếu không được
      : undefined;
  const source = pickVideoSource(content ?? undefined, uploadId ? hlsReady : true);

  return {
    source,
    src: enabled && source.state === "ready" ? source.src : null,
    isChecking: enabled && !!uploadId && (isLoading || source.state === "checking"),
  };
}
