/**
 * Video-related type definitions
 */

export type VideoStatus = "uploading" | "processing" | "ready" | "failed";

export interface Video {
  id: string;
  title?: string;
  filename: string;
  size: number;
  duration?: number;
  thumbnail_url?: string;
  hls_url?: string;
  qualities?: string[];
  status: VideoStatus;
  created_at: string;
  updated_at?: string;
}

export interface VideoUploadProgress {
  upload_id: string;
  filename: string;
  size: number;
  status: VideoStatus;
  progress: number;
  chunks_uploaded: number;
  total_chunks: number;
  created_at: string;
}

export interface VideoUploadRequest {
  file: File;
  onProgress?: (progress: number) => void;
}

export interface HlsManifest {
  video_id: string;
  manifest_url: string;
  qualities: string[];
  duration?: number;
}

export interface HlsProcessingStatus {
  video_id: string;
  status: VideoStatus;
  progress?: number;
  error?: string;
  completed_at?: string;
}
