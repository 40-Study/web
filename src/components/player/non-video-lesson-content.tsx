"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, Loader2, Radio } from "lucide-react";
import { toast } from "sonner";
import { enrollmentService, type LessonProgressResponse } from "@/services/enrollment.service";
import { LIVESTREAM_NOT_READY_HINT } from "@/lib/lesson-content-link";
import { invalidateAfterLessonProgress } from "./lesson-progress-sync";
import type { NonVideoLessonKind } from "./lesson-kind";

interface NonVideoLessonContentProps {
  kind: NonVideoLessonKind;
  lessonId: string;
  courseId: string;
  courseSlug: string;
  title: string;
  description?: string | null;
  /** Bài đã `completed` theo curriculum của server. */
  completed: boolean;
  /** Link phòng live (chỉ bài livestream); `null` = phiên chưa sẵn sàng. */
  livestreamHref?: string | null;
  onProgress?: (progress: LessonProgressResponse) => void;
}

const COPY: Record<NonVideoLessonKind, { badge: string; hint: string }> = {
  exercise: {
    badge: "Bài tập thực hành",
    hint: "Làm bài theo hướng dẫn của giảng viên, sau đó bấm \"Đánh dấu hoàn thành\" để ghi nhận tiến độ.",
  },
  livestream: {
    badge: "Buổi học trực tiếp",
    hint: "Tham gia buổi học theo lịch của giảng viên, sau đó bấm \"Đánh dấu hoàn thành\" để ghi nhận tiến độ.",
  },
};

/**
 * Bài không có video (bài tập, buổi live) — A2, QA vòng 2 (N6).
 *
 * Trước đây trang học coi mọi bài là video: bài tập hiện "Video không khả dụng"
 * và không có cách nào hoàn thành, nên khoá có bài tập không bao giờ đạt 100%.
 * Server không có video để tự chấm với loại bài này nên nhận `completed` do
 * người học gửi (enrollment_service.go, luật 2c(b)); bài có video vẫn chỉ được
 * server tự chốt theo % đã xem.
 */
export function NonVideoLessonContent({
  kind,
  lessonId,
  courseId,
  courseSlug,
  title,
  description,
  completed,
  livestreamHref,
  onProgress,
}: NonVideoLessonContentProps) {
  const queryClient = useQueryClient();
  const copy = COPY[kind];

  const markCompleted = useMutation({
    mutationFn: () => enrollmentService.updateProgress(lessonId, { status: "completed" }),
    onSuccess: (progress) => {
      invalidateAfterLessonProgress(queryClient, courseId);
      if (progress.status === "completed") {
        toast.success("Đã ghi nhận hoàn thành bài học.");
      } else {
        toast.error("Chưa ghi nhận được hoàn thành. Vui lòng thử lại.");
      }
      onProgress?.(progress);
    },
    onError: () => {
      toast.error("Không lưu được tiến độ. Vui lòng kiểm tra kết nối và thử lại.");
    },
  });

  const isDone = completed || markCompleted.data?.status === "completed";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary-600">
        {kind === "exercise" ? <ClipboardList className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
        <span>{copy.badge}</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {description ? (
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
      ) : null}
      <p className="text-sm text-gray-500">{copy.hint}</p>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {kind === "exercise" && (
          <Link
            href={`/courses/${courseSlug}/exercises`}
            className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
          >
            Xem bài tập của khoá
          </Link>
        )}
        {kind === "livestream" &&
          (livestreamHref ? (
            <Link
              href={livestreamHref}
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
            >
              Vào phòng học trực tiếp
            </Link>
          ) : (
            <span className="text-sm text-gray-500">{LIVESTREAM_NOT_READY_HINT}</span>
          ))}

        {isDone ? (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            Đã hoàn thành
          </span>
        ) : (
          <button
            type="button"
            onClick={() => markCompleted.mutate()}
            disabled={markCompleted.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {markCompleted.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Đánh dấu hoàn thành
          </button>
        )}
      </div>
    </div>
  );
}
