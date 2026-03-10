/**
 * Video upload and streaming service
 */

import { api } from "@/lib/api-client";

export interface VideoUpload {
  id: string;
  filename: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "failed";
  progress: number;
  chunks_uploaded: number;
  total_chunks: number;
  created_at: string;
}

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail_url?: string;
  hls_url: string;
  qualities: string[];
  created_at: string;
}

export interface InitUploadDTO {
  filename: string;
  size: number;
  content_type: string;
}

export interface ChunkUploadResponse {
  chunk_index: number;
  uploaded: boolean;
}

export const videoService = {
  // Upload
  initUpload: (data: InitUploadDTO) =>
    api.post<{ upload_id: string; chunk_size: number; total_chunks: number }>("/videos/upload/init", data).then((r) => r.data),

  getPresignedUrl: (uploadId: string, chunkIndex: number) =>
    api.get<{ url: string; expires_at: string }>(`/videos/upload/${uploadId}/presigned-url`, { params: { chunk_index: chunkIndex } }).then((r) => r.data),

  completeChunk: (uploadId: string, chunkIndex: number, etag: string) =>
    api.post<ChunkUploadResponse>(`/videos/upload/${uploadId}/chunks/${chunkIndex}`, { etag }).then((r) => r.data),

  completeUpload: (uploadId: string) =>
    api.post<VideoUpload>(`/videos/upload/${uploadId}/complete`, {}).then((r) => r.data),

  getUploadStatus: (uploadId: string) =>
    api.get<VideoUpload>(`/videos/upload/${uploadId}/status`).then((r) => r.data),

  resumeUpload: (uploadId: string) =>
    api.get<{ missing_chunks: number[] }>(`/videos/upload/${uploadId}/resume`).then((r) => r.data),

  cancelUpload: (uploadId: string) =>
    api.delete<void>(`/videos/upload/${uploadId}`).then((r) => r.data),

  // Processing queue
  getProcessingQueue: () =>
    api.get<{ videos: VideoUpload[] }>("/videos/processing").then((r) => r.data),

  // Video info
  getVideo: (id: string) =>
    api.get<VideoInfo>(`/videos/${id}`).then((r) => r.data),

  listVideos: () =>
    api.get<{ videos: VideoInfo[] }>("/videos").then((r) => r.data),

  // HLS streaming
  getMasterPlaylist: (videoId: string) =>
    api.get<string>(`/hls/${videoId}/master.m3u8`).then((r) => r.data),
};
