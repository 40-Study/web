/**
 * HLS streaming service
 * Endpoints: /hls/:uploadId/*
 */

function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return "/api";
  }
  return "http://localhost:5000/api";
}

const API_BASE_URL = resolveApiBaseUrl();

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VideoInfo {
  upload_id: string;
  duration?: number;
  qualities?: { id: string; label: string; playlist: string }[];
  status: string;
  hls_ready?: boolean;
  fallback_url?: string; // URL video gốc khi HLS chưa sẵn sàng
  master_url?: string;
  message?: string;
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
