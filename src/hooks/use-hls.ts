"use client";

/**
 * Hook for HLS manifest and processing status
 */

import { useQuery } from "@tanstack/react-query";
import { hlsService } from "@/services/hls.service";
import type { HlsManifest, HlsProcessingStatus } from "@/types/video";

/**
 * Fetch HLS manifest for a video.
 */
export function useHlsManifest(videoId: string | null) {
  return useQuery<HlsManifest>({
    queryKey: ["hls-manifest", videoId],
    queryFn: () => hlsService.getManifest(videoId!),
    enabled: !!videoId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Poll HLS processing status until ready or failed.
 */
export function useHlsProcessingStatus(videoId: string | null, enabled = true) {
  return useQuery<HlsProcessingStatus>({
    queryKey: ["hls-status", videoId],
    queryFn: () => hlsService.getProcessingStatus(videoId!),
    enabled: !!videoId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "ready" || status === "failed") return false;
      return 3000;
    },
  });
}
