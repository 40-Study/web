/**
 * HLS streaming service
 * Backend endpoints: /api/hls/:uploadId/*
 *
 * Mọi endpoint HLS đòi URL KÝ (query `exp/uid/sig`) do API nội dung bài học cấp trong
 * `video_hls_url` — xem `lib/hls-playback.ts`. Service này KHÔNG tự dựng URL playlist/segment/file
 * gốc nữa: URL không chữ ký luôn bị 403, và file gốc không được cấp cho học viên.
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
  master_url?: string;
  message?: string;
}

/** Backend từ chối chữ ký (thiếu/sai/hết hạn) — người gọi nên xin URL ký mới. */
export class HlsAuthError extends Error {
  constructor() {
    super("HLS signed URL rejected");
    this.name = "HlsAuthError";
  }
}

// ─── Service ────────────────────────────────────────────────────────────────

export const hlsService = {
  /**
   * GET /api/hls/:uploadId/info?{signedQuery} — trạng thái HLS của video.
   * `signedQuery` lấy từ `video_hls_url` (`signedQueryOf`).
   */
  getInfo: async (uploadId: string, signedQuery: string): Promise<VideoInfo> => {
    const res = await fetch(`${API_BASE_URL}/hls/${uploadId}/info?${signedQuery}`);
    if (res.status === 403) {
      throw new HlsAuthError();
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch video info: ${res.status}`);
    }
    const data = await res.json();
    return data.data || data;
  },

  /** Check if video is ready for streaming */
  isVideoReady: async (uploadId: string, signedQuery: string): Promise<boolean> => {
    try {
      const info = await hlsService.getInfo(uploadId, signedQuery);
      return info.hls_ready === true || info.status === "ready";
    } catch {
      return false;
    }
  },
};
