"use client";

/**
 * Hook for video upload with progress tracking and status polling
 * Uses chunked upload API: init → presigned-urls → upload chunks → complete
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { videoUploadService } from "@/services/video-upload.service";
import type { UploadStatus } from "@/services/video-upload.service";

export interface UseVideoUploadReturn {
  upload: (file: File, resourceId: string, resourceType?: string) => Promise<string | null>;
  progress: number;
  isUploading: boolean;
  uploadId: string | null;
  error: Error | null;
  reset: () => void;
}

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BANDWIDTH_BYTES_PER_SEC = 10 * 1024 * 1024; // 10 MB/s

/** Rate limiter to enforce bandwidth limit across all chunks */
class UploadRateLimiter {
  private totalBytes = 0;
  private startTime = Date.now();

  /** Record bytes and wait to maintain target bandwidth */
  async throttle(bytes: number): Promise<void> {
    this.totalBytes += bytes;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const expectedTime = this.totalBytes / MAX_BANDWIDTH_BYTES_PER_SEC;
    const delay = (expectedTime - elapsed) * 1000;

    if (delay > 0) {
      console.log(
        `[Throttle] Uploaded ${(this.totalBytes / 1024 / 1024).toFixed(1)}MB in ${elapsed.toFixed(1)}s, ` +
          `target: ${expectedTime.toFixed(1)}s, waiting ${(delay / 1000).toFixed(1)}s`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/** Upload a chunk and return ETag */
async function uploadChunk(url: string, chunk: Blob): Promise<string> {
  const response = await fetch(url, {
    method: "PUT",
    body: chunk,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.headers.get("ETag") || "";
}

/**
 * Hook for uploading a video file via chunked upload with progress.
 */
export function useVideoUpload(): UseVideoUploadReturn {
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File, resourceId: string, resourceType = "lesson_video"): Promise<string | null> => {
      setProgress(0);
      setError(null);
      setIsUploading(true);

      try {
        // 1. Init upload
        const initResult = await videoUploadService.initUpload({
          resource_id: resourceId,
          resource_type: resourceType,
          original_file_name: file.name,
          content_type: file.type,
          file_size: file.size,
          chunk_size: DEFAULT_CHUNK_SIZE,
        });

        const { upload_id, chunk_count } = initResult;
        setUploadId(upload_id);

        // 2. Get presigned URLs for all chunks
        const chunkNumbers = Array.from({ length: chunk_count }, (_, i) => i + 1);
        const presignedUrls = await videoUploadService.getPresignedUrls({
          upload_id,
          chunk_numbers: chunkNumbers,
        });

        // 3. Upload each chunk with bandwidth limiting (10 MB/s total)
        const rateLimiter = new UploadRateLimiter();
        for (let i = 0; i < chunk_count; i++) {
          const start = i * DEFAULT_CHUNK_SIZE;
          const end = Math.min(start + DEFAULT_CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          const chunkSize = end - start;

          const presigned = presignedUrls[i];
          const etag = await uploadChunk(presigned.url, chunk);

          // Throttle: wait if we're uploading faster than 10 MB/s
          await rateLimiter.throttle(chunkSize);

          await videoUploadService.chunkComplete({
            upload_id,
            chunk_number: presigned.chunk_number,
            etag,
            size: chunkSize,
          });

          setProgress(Math.round(((i + 1) / chunk_count) * 100));
        }

        // 4. Complete
        await videoUploadService.completeUpload(upload_id);
        toast.success("Tải video lên thành công");
        setIsUploading(false);
        return upload_id;
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Upload failed");
        setError(e);
        setIsUploading(false);
        toast.error("Tải video lên thất bại", { description: e.message });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setProgress(0);
    setUploadId(null);
    setError(null);
    setIsUploading(false);
  }, []);

  return { upload, progress, isUploading, uploadId, error, reset };
}

/**
 * Hook for polling upload status by ID.
 */
export function useVideoStatus(uploadId: string | null, enabled = true) {
  return useQuery<UploadStatus>({
    queryKey: ["video-status", uploadId],
    queryFn: () => videoUploadService.getUploadStatus(uploadId!),
    enabled: !!uploadId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "ready" || status === "failed" || status === "completed") return false;
      return 3000;
    },
  });
}
