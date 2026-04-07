/**
 * HLS streaming service
 * Endpoints: /hls/:uploadId/*
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VideoInfo {
  upload_id: string;
  duration?: number;
  qualities?: string[];
  status: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const hlsService = {
  /** GET /hls/:uploadId/info — video info */
  getInfo: (uploadId: string) =>
    fetch(`${API_BASE_URL}/hls/${uploadId}/info`).then((r) => r.json()),

  /** Build master playlist URL (for HLS player) */
  getMasterPlaylistUrl: (uploadId: string) =>
    `${API_BASE_URL}/hls/${uploadId}/master.m3u8`,

  /** Build quality playlist URL */
  getQualityPlaylistUrl: (uploadId: string, quality: string) =>
    `${API_BASE_URL}/hls/${uploadId}/${quality}/index.m3u8`,

  /** Build segment URL */
  getSegmentUrl: (uploadId: string, quality: string, segment: string) =>
    `${API_BASE_URL}/hls/${uploadId}/${quality}/${segment}`,
};
