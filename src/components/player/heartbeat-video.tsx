"use client";

/**
 * Video + heartbeat chống tua (contract §1).
 *
 * Tách khỏi trang learn vì đây là chỗ duy nhất biết nối `VideoPlayer` với
 * `useVideoProgress`: player phát ra tick `timeupdate`/`play`/`pause`, hook gom
 * khoảng đã phát thật rồi gửi lên server, server trả `watched_pct`/`status`.
 *
 * Sau khi server chốt tiến độ, curriculum bị invalidate để sidebar đổi trạng
 * thái bài (completed / bài kế tiếp được mở khoá) mà không cần F5.
 */

import { useCallback, type MutableRefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  VideoPlayer,
  type CaptionTrack,
  type VideoPlayerHandle,
} from "@/components/lesson/video-player";
import { useVideoProgress } from "@/hooks/use-video-progress";
import type { LessonProgressResponse } from "@/services/enrollment.service";
import { courseKeys } from "@/hooks/queries/use-courses";
import { sectionKeys } from "@/hooks/queries/use-sections";

interface HeartbeatVideoProps {
  src: string;
  lessonId: string;
  /** Vị trí resume (giây) — đã qua `resolveResumeSeconds`. */
  resumeSeconds: number;
  /** Phụ đề WebVTT của bài (contract §4); `null` = không có. */
  subtitleUrl?: string | null;
  /** Bật/tắt phụ đề từ phím tắt C của trang (contract §7). */
  captionsEnabled?: boolean;
  courseId?: string;
  /**
   * Quan sát thêm mỗi tick `timeupdate` (ví dụ để panel ghi chú biết giây hiện tại).
   * Chỉ là *thêm*: heartbeat vẫn luôn chạy — truyền prop này KHÔNG tắt chống tua.
   */
  onTimeUpdate?: (currentTime: number, playbackRate: number, durationSeconds: number) => void;
  onProgressChange?: (progress: LessonProgressResponse) => void;
  /** Báo lên trang mỗi tick — panel ghi chú dùng để biết giây hiện tại. */
  onClockTick?: (currentTime: number) => void;
  /** Player đang phát hay không — phím tắt Space cần biết để không "phát" hai lần. */
  onPlayingChange?: (isPlaying: boolean) => void;
  /** Cầu điều khiển ra ngoài: panel ghi chú/transcript cần seek tới mốc. */
  controlRef?: MutableRefObject<VideoPlayerHandle | null>;
  /** `?` — mở bảng phím tắt; player bắt phím, trang quyết định hiện gì. */
  onToggleShortcutsHelp?: () => void;
  className?: string;
}

export function HeartbeatVideo({
  src,
  lessonId,
  resumeSeconds,
  subtitleUrl,
  captionsEnabled = true,
  courseId,
  onTimeUpdate,
  onProgressChange,
  onClockTick,
  onPlayingChange,
  controlRef,
  onToggleShortcutsHelp,
  className,
}: HeartbeatVideoProps) {
  const queryClient = useQueryClient();

  const handleProgressChange = useCallback(
    (progress: LessonProgressResponse) => {
      onProgressChange?.(progress);
      // Chỉ refetch khi có gì đó thật sự đổi — heartbeat 10 giây/lần mà
      // invalidate mỗi lần thì sidebar nhấp nháy vô ích.
      if (progress.status === "completed" || progress.next_lesson_unlocked) {
        if (courseId) {
          void queryClient.invalidateQueries({ queryKey: sectionKeys.byCourse(courseId) });
        }
        void queryClient.invalidateQueries({ queryKey: courseKeys.enrolled() });
      }
    },
    [courseId, onProgressChange, queryClient]
  );

  const { handleTimeUpdate, flushNow } = useVideoProgress({
    lessonId,
    initialPositionSeconds: resumeSeconds,
    onProgressChange: handleProgressChange,
  });

  /**
   * Luôn chạy heartbeat trước, rồi mới báo cho bên ngoài. Nếu để bên ngoài thay
   * thế (`onTimeUpdate ?? handleTimeUpdate`) thì chỉ cần một panel cần giây hiện
   * tại là chống tua tắt im lặng — hỏng đúng thứ khó phát hiện nhất.
   */
  const handleTick = useCallback(
    (currentTime: number, playbackRate: number, durationSeconds: number) => {
      handleTimeUpdate(currentTime, playbackRate, durationSeconds);
      onTimeUpdate?.(currentTime, playbackRate, durationSeconds);
      onClockTick?.(currentTime);
    },
    [handleTimeUpdate, onTimeUpdate, onClockTick]
  );

  const captions: CaptionTrack[] =
    subtitleUrl && captionsEnabled
      ? [{ lang: "vi", label: "Tiếng Việt", src: subtitleUrl }]
      : [];

  return (
    <VideoPlayer
      src={src}
      className={className ?? "rounded-none"}
      initialTime={resumeSeconds}
      captions={captions}
      onTimeUpdate={handleTick}
      onPlay={() => onPlayingChange?.(true)}
      onPause={() => {
        onPlayingChange?.(false);
        flushNow();
      }}
      controlRef={controlRef}
      onToggleShortcutsHelp={onToggleShortcutsHelp}
    />
  );
}
