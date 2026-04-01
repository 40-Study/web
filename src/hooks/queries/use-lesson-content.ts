/**
 * React Query hooks for lesson content (video, article, attachments)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { lessonContentService } from "@/services/lesson-content.service";
import type {
  CreateLessonVideoDTO,
  UpdateLessonVideoDTO,
  CreateLessonArticleDTO,
  UpdateLessonArticleDTO,
  CreateLessonAttachmentDTO,
} from "@/types/lesson-content";

export const lessonContentKeys = {
  all: ["lesson-content"] as const,
  video: (lessonId: string) => [...lessonContentKeys.all, "video", lessonId] as const,
  article: (lessonId: string) => [...lessonContentKeys.all, "article", lessonId] as const,
  attachments: (lessonId: string) =>
    [...lessonContentKeys.all, "attachments", lessonId] as const,
};

// ─── Video hooks ──────────────────────────────────────────────────────────────

export function useLessonVideo(lessonId: string) {
  return useQuery({
    queryKey: lessonContentKeys.video(lessonId),
    queryFn: () => lessonContentService.getVideo(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateLessonVideo(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonVideoDTO) =>
      lessonContentService.createVideo(lessonId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.video(lessonId) });
      toast.success("Đã thêm video bài học");
    },
    onError: () => toast.error("Không thể thêm video"),
  });
}

export function useUpdateLessonVideo(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLessonVideoDTO) =>
      lessonContentService.updateVideo(lessonId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.video(lessonId) });
      toast.success("Đã cập nhật video");
    },
    onError: () => toast.error("Không thể cập nhật video"),
  });
}

export function useDeleteLessonVideo(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => lessonContentService.deleteVideo(lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.video(lessonId) });
      toast.success("Đã xóa video");
    },
    onError: () => toast.error("Không thể xóa video"),
  });
}

// ─── Article hooks ────────────────────────────────────────────────────────────

export function useLessonArticle(lessonId: string) {
  return useQuery({
    queryKey: lessonContentKeys.article(lessonId),
    queryFn: () => lessonContentService.getArticle(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateLessonArticle(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonArticleDTO) =>
      lessonContentService.createArticle(lessonId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.article(lessonId) });
      toast.success("Đã tạo bài viết");
    },
    onError: () => toast.error("Không thể tạo bài viết"),
  });
}

export function useUpdateLessonArticle(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLessonArticleDTO) =>
      lessonContentService.updateArticle(lessonId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.article(lessonId) });
      toast.success("Đã cập nhật bài viết");
    },
    onError: () => toast.error("Không thể cập nhật bài viết"),
  });
}

export function useDeleteLessonArticle(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => lessonContentService.deleteArticle(lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.article(lessonId) });
      toast.success("Đã xóa bài viết");
    },
    onError: () => toast.error("Không thể xóa bài viết"),
  });
}

// ─── Attachment hooks ─────────────────────────────────────────────────────────

export function useLessonAttachments(lessonId: string) {
  return useQuery({
    queryKey: lessonContentKeys.attachments(lessonId),
    queryFn: () => lessonContentService.getAttachments(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateLessonAttachment(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonAttachmentDTO) =>
      lessonContentService.createAttachment(lessonId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.attachments(lessonId) });
      toast.success("Đã thêm tài liệu đính kèm");
    },
    onError: () => toast.error("Không thể thêm tài liệu"),
  });
}

export function useDeleteLessonAttachment(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      lessonContentService.deleteAttachment(lessonId, attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.attachments(lessonId) });
      toast.success("Đã xóa tài liệu đính kèm");
    },
    onError: () => toast.error("Không thể xóa tài liệu"),
  });
}
