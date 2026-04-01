"use client";

/**
 * Hook for video upload with progress tracking and status polling
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { videoUploadService } from "@/services/video-upload.service";
import type { Video, VideoUploadProgress } from "@/types/video";

export interface UseVideoUploadReturn {
  upload: (file: File) => Promise<Video | null>;
  progress: number;
  isUploading: boolean;
  uploadedVideo: Video | null;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for uploading a video file with progress reporting.
 */
export function useVideoUpload(): UseVideoUploadReturn {
  const [progress, setProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<Video | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (file: File) =>
      videoUploadService.uploadVideo(file, { onProgress: setProgress }),
    onSuccess: (video) => {
      setUploadedVideo(video);
      toast.success("Tải video lên thành công");
    },
    onError: (err: Error) => {
      setError(err);
      toast.error("Tải video lên thất bại", { description: err.message });
    },
  });

  const upload = useCallback(
    async (file: File): Promise<Video | null> => {
      abortRef.current = false;
      setProgress(0);
      setError(null);
      try {
        const result = await mutation.mutateAsync(file);
        return result;
      } catch {
        return null;
      }
    },
    [mutation]
  );

  const reset = useCallback(() => {
    setProgress(0);
    setUploadedVideo(null);
    setError(null);
    abortRef.current = true;
  }, []);

  return {
    upload,
    progress,
    isUploading: mutation.isPending,
    uploadedVideo,
    error,
    reset,
  };
}

/**
 * Hook for polling video status by ID.
 */
export function useVideoStatus(videoId: string | null, enabled = true) {
  return useQuery<VideoUploadProgress>({
    queryKey: ["video-status", videoId],
    queryFn: () => videoUploadService.getStatus(videoId!),
    enabled: !!videoId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling once ready or failed
      if (status === "ready" || status === "failed") return false;
      return 3000;
    },
  });
}

/**
 * Hook for fetching video info by ID.
 */
export function useVideo(videoId: string | null) {
  return useQuery<Video>({
    queryKey: ["video", videoId],
    queryFn: () => videoUploadService.getVideo(videoId!),
    enabled: !!videoId,
    staleTime: 5 * 60 * 1000,
  });
}
