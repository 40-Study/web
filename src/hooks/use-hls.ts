"use client";

/**
 * Hook for HLS video info with fallback support
 */

import { useQuery } from "@tanstack/react-query";
import { hlsService, type VideoInfo } from "@/services/hls.service";

/**
 * Fetch HLS video info (status, qualities, duration).
 * Polls while status is not "ready" or "failed".
 */
export function useHlsInfo(videoId: string | null, poll = false) {
  return useQuery<VideoInfo>({
    queryKey: ["hls-info", videoId],
    queryFn: () => hlsService.getInfo(videoId!),
    enabled: !!videoId,
    staleTime: 10 * 60 * 1000,
    refetchInterval: poll
      ? (query) => {
          const data = query.state.data;
          // Stop polling when HLS is ready or failed
          if (data?.hls_ready === true || data?.status === "failed") return false;
          // Keep polling every 5s while processing
          return 5000;
        }
      : false,
  });
}

/**
 * Get the best available video URL (HLS if ready, fallback otherwise)
 */
export function getVideoUrl(info: VideoInfo | undefined, videoId: string): string | null {
  if (!info || !videoId) return null;

  // HLS ready - use master playlist
  if (info.hls_ready === true) {
    return hlsService.getMasterPlaylistUrl(videoId);
  }

  // HLS not ready - use fallback (original video)
  if (info.fallback_url) {
    return info.fallback_url;
  }

  return null;
}
