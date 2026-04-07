/**
 * Video upload service — handles multipart file upload with progress tracking
 */

import { api } from "@/lib/api-client";
import type { Video, VideoUploadProgress } from "@/types/video";

export interface UploadVideoOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Upload a video file using multipart/form-data with optional progress callback.
 * POST /videos/upload
 */
async function uploadVideo(file: File, options?: UploadVideoOptions): Promise<Video> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<Video>("/videos/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (options?.onProgress && event.total) {
        const percent = Math.round((event.loaded * 100) / event.total);
        options.onProgress(percent);
      }
    },
  });

  return response.data;
}

/**
 * Get video info by ID.
 * GET /videos/:id
 */
async function getVideo(id: string): Promise<Video> {
  const response = await api.get<Video>(`/videos/${id}`);
  return response.data;
}

/**
 * Get upload/processing status for a video.
 * GET /videos/:id/status
 */
async function getStatus(id: string): Promise<VideoUploadProgress> {
  const response = await api.get<VideoUploadProgress>(`/videos/${id}/status`);
  return response.data;
}

/**
 * Delete a video by ID.
 * DELETE /videos/:id
 */
async function deleteVideo(id: string): Promise<void> {
  await api.delete(`/videos/${id}`);
}

export const videoUploadService = {
  uploadVideo,
  getVideo,
  getStatus,
  deleteVideo,
};
