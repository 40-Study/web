"use client";

/**
 * Hook for HLS video info
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
          const status = query.state.data?.status;
          if (status === "ready" || status === "failed") return false;
          return 3000;
        }
      : false,
  });
}
