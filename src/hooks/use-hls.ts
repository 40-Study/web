"use client";

/**
 * Hook for HLS video info (trạng thái xử lý)
 */

import { useQuery } from "@tanstack/react-query";
import { hlsService, HlsAuthError, type VideoInfo } from "@/services/hls.service";

/**
 * Fetch HLS video info (status, qualities, duration).
 * Polls while status is not "ready" or "failed".
 *
 * `signedQuery`: query của URL ký (`signedQueryOf(video_hls_url)`). Rỗng = chưa có URL ký nên
 * không gọi (backend sẽ 403).
 */
export function useHlsInfo(videoId: string | null, signedQuery: string, poll = false) {
  return useQuery<VideoInfo>({
    // Khoá gồm chữ ký: URL ký mới (sau khi bị 403) tự kích hoạt gọi lại `/info`. `placeholderData`
    // giữ kết quả cũ trong lúc đó để trang không nhấp nháy về trạng thái "đang tải" mỗi lần đổi chữ ký.
    queryKey: ["hls-info", videoId, signedQuery],
    queryFn: () => hlsService.getInfo(videoId!, signedQuery),
    enabled: !!videoId && !!signedQuery,
    placeholderData: (previous) => previous,
    staleTime: 10 * 60 * 1000,
    // 403 = chữ ký hết hạn: thử lại cùng URL vô ích, trang sẽ xin URL mới (xem trang learn).
    retry: (failureCount, error) => !(error instanceof HlsAuthError) && failureCount < 3,
    refetchInterval: poll
      ? (query) => {
          const data = query.state.data;
          // Stop polling when HLS is ready or failed
          if (data?.hls_ready === true || data?.status === "failed") return false;
          // Keep polling every 5s while processing (không poll khi đang bị từ chối chữ ký)
          if (query.state.error instanceof HlsAuthError) return false;
          return 5000;
        }
      : false,
  });
}

/**
 * Check if video is using HLS streaming
 */
export function isHlsStream(info: VideoInfo | undefined): boolean {
  if (!info) return false;
  return info.hls_ready === true || info.status === "ready";
}
