/**
 * HLS streaming service — manifest and processing status
 */

import { api } from "@/lib/api-client";
import type { HlsManifest, HlsProcessingStatus } from "@/types/video";

/**
 * Get HLS manifest for a video.
 * GET /hls/:videoId/manifest
 */
async function getManifest(videoId: string): Promise<HlsManifest> {
  const response = await api.get<HlsManifest>(`/hls/${videoId}/manifest`);
  return response.data;
}

/**
 * Get HLS processing status for a video.
 * GET /hls/:videoId/status
 */
async function getProcessingStatus(videoId: string): Promise<HlsProcessingStatus> {
  const response = await api.get<HlsProcessingStatus>(`/hls/${videoId}/status`);
  return response.data;
}

export const hlsService = {
  getManifest,
  getProcessingStatus,
};
