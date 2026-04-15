/**
 * HLS streaming service
 * Backend endpoints: /api/hls/:uploadId/*
 */

function resolveApiBaseUrl(): string {
  // Always use relative path for browser (proxied by Next.js)
  if (typeof window !== "undefined") {
    return "/api";
  }
  // Server-side: use environment variable or default
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://127.0.0.1:5000/api";
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
  /** GET /api/hls/:uploadId/info — video info */
  getInfo: async (uploadId: string): Promise<VideoInfo> => {
    const res = await fetch(`${API_BASE_URL}/hls/${uploadId}/info`);
    if (!res.ok) {
      throw new Error(`Failed to fetch video info: ${res.status}`);
    }
    const data = await res.json();
    return data.data || data;
  },

  /** Build master playlist URL (for HLS player) */
  getMasterPlaylistUrl: (uploadId: string) =>
    `${API_BASE_URL}/hls/${uploadId}/master.m3u8`,

  /** Build fallback video URL (original video when HLS not ready) */
  getFallbackVideoUrl: (uploadId: string) =>
    `${API_BASE_URL}/hls/${uploadId}/video.mp4`,

  /** Build quality playlist URL */
  getQualityPlaylistUrl: (uploadId: string, quality: string) =>
    `${API_BASE_URL}/hls/${uploadId}/${quality}/index.m3u8`,

  /** Build segment URL */
  getSegmentUrl: (uploadId: string, quality: string, segment: string) =>
    `${API_BASE_URL}/hls/${uploadId}/${quality}/${segment}`,

  /** Check if video is ready for streaming */
  isVideoReady: async (uploadId: string): Promise<boolean> => {
    try {
      const info = await hlsService.getInfo(uploadId);
      return info.hls_ready === true || info.status === "ready";
    } catch {
      return false;
    }
  },
};
