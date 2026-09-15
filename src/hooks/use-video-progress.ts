"use client";

/**
 * Heartbeat chống tua (contract §1).
 *
 * Hook này gom khoảng "đã phát thật" từ sự kiện `timeupdate` của thẻ `<video>`,
 * gửi 10 giây một lần (và ngay khi pause / rời trang qua `sendBeacon`), rồi đọc
 * `watched_pct` / `status` / `next_lesson_unlocked` từ response để cập nhật UI.
 *
 * Hai điều hook này CỐ Ý không làm:
 *  - Không tự đặt `status = completed`. Server tính `watched_pct` từ các khoảng
 *    đã gửi và tự chốt `completed` khi vượt `course.min_video_pct`; client gửi
 *    `completed` lên chỉ bị backend bỏ qua.
 *  - Không gửi `played_ranges` chứa đoạn tua qua. `handleTimeUpdate` chỉ nối dài
 *    khoảng đang mở khi mẫu mới khớp thời gian thực trôi qua; nhảy xa (seek,
 *    buffering dài) đóng khoảng cũ và mở khoảng mới.
 *
 * Mất mạng: khoảng chưa gửi được giữ trong ref và gửi kèm lần heartbeat sau,
 * nên tiến độ không mất — chỉ chậm.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { enrollmentService, type LessonProgressResponse } from "@/services/enrollment.service";
import {
  HEARTBEAT_INTERVAL_MS,
  appendSample,
  buildHeartbeatPayload,
  isContinuousSample,
  openRange,
  pendingAfterFailure,
  type PlayedRange,
} from "@/lib/played-ranges";

export interface UseVideoProgressOptions {
  lessonId: string;
  /** Vị trí resume đọc từ curriculum (`progress.last_position_seconds`). */
  initialPositionSeconds?: number;
  /** Gọi khi server chốt `completed` — KHÔNG phải khi video `ended`. */
  onProgressChange?: (progress: LessonProgressResponse) => void;
}

export interface UseVideoProgressResult {
  /** Gắn vào `VideoPlayer` qua prop `onTimeUpdate`. */
  handleTimeUpdate: (currentTime: number, playbackRate: number, durationSeconds?: number) => void;
  /** Gọi khi người học pause — gửi ngay, không đợi nhịp 10 giây. */
  flushNow: () => void;
  /** Tiến độ mới nhất do server trả về. */
  progress: LessonProgressResponse | null;
  /** Vị trí resume đã áp vào player. */
  resumeSeconds: number;
}

export function useVideoProgress({
  lessonId,
  initialPositionSeconds = 0,
  onProgressChange,
}: UseVideoProgressOptions): UseVideoProgressResult {
  const [progress, setProgress] = useState<LessonProgressResponse | null>(null);

  const rangesRef = useRef<PlayedRange[]>([]);
  const pendingRef = useRef<PlayedRange[]>([]);
  const lastSampleRef = useRef<{ time: number; at: number } | null>(null);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const playbackRateRef = useRef(1);
  const lessonIdRef = useRef(lessonId);
  const onProgressChangeRef = useRef(onProgressChange);
  const inFlightRef = useRef(false);

  useEffect(() => {
    lessonIdRef.current = lessonId;
    // Đổi bài = reset toàn bộ bộ gom, nếu không khoảng của bài cũ sẽ được gửi
    // lên cho bài mới.
    rangesRef.current = [];
    pendingRef.current = [];
    lastSampleRef.current = null;
    positionRef.current = 0;
    durationRef.current = 0;
    setProgress(null);
  }, [lessonId]);

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  const send = useCallback(async (useBeacon = false) => {
    if (inFlightRef.current && !useBeacon) return;
    if (durationRef.current <= 0) return;

    const payload = buildHeartbeatPayload({
      lessonId: lessonIdRef.current,
      positionSeconds: positionRef.current,
      durationSeconds: durationRef.current,
      ranges: rangesRef.current,
    });

    // Không có gì mới thì không bắn request rỗng làm phiền server.
    if (!useBeacon && payload.played_ranges.length === 0) return;

    rangesRef.current = [];

    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const body = new Blob([JSON.stringify(payload)], { type: "application/json" });
      // `sendBeacon` bắn vào path tương đối của trang; backend proxy `/api` nhận ở đây.
      navigator.sendBeacon("/api/progress", body);
      return;
    }

    inFlightRef.current = true;
    try {
      const response = await enrollmentService.updateProgress(lessonIdRef.current, {
        status: "in_progress",
        position_seconds: payload.position_seconds,
        duration_seconds: payload.duration_seconds,
        played_ranges: payload.played_ranges,
      });
      setProgress(response);
      onProgressChangeRef.current?.(response);
    } catch {
      // Mất mạng: giữ khoảng lại để gửi kèm lần sau, không mất tiến độ.
      // `justSent` đã bị rút khỏi `rangesRef` trước khi gửi, nên phải cộng cả hai
      // nguồn — chỉ cộng `rangesRef` là mất đúng khoảng vừa gửi hỏng.
      const justSent = payload.played_ranges;
      pendingRef.current = pendingAfterFailure(pendingRef.current, justSent);
      rangesRef.current = pendingAfterFailure(rangesRef.current, justSent);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const handleTimeUpdate = useCallback(
    (currentTime: number, playbackRate: number, durationSeconds?: number) => {
      const now = Date.now();
      durationRef.current = Math.max(durationRef.current, durationSeconds ?? 0, currentTime);
      positionRef.current = currentTime;
      playbackRateRef.current = playbackRate;

      const previous = lastSampleRef.current;
      lastSampleRef.current = { time: currentTime, at: now };

      // Mẫu đầu tiên sau khi gắn video chỉ mở khoảng, không nối dài — chưa có
      // mốc trước để so, nên coi nó là điểm bắt đầu chứ không phải bằng chứng
      // của một khoảng đã phát.
      if (previous && isContinuousSample(previous.time, currentTime, playbackRate, now - previous.at)) {
        rangesRef.current = appendSample(rangesRef.current, currentTime);
        return;
      }
      // Seek / buffering / mẫu đầu: đoạn nhảy qua KHÔNG được tính, nhưng những
      // khoảng đã gom trước đó thì vẫn giữ — `openRange` chứ không phải reset.
      rangesRef.current = openRange(rangesRef.current, currentTime);
    },
    []
  );

  const flushNow = useCallback(() => {
    void send(false);
  }, [send]);

  // Nhịp gửi 10 giây.
  useEffect(() => {
    const timer = setInterval(() => void send(false), HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [send]);

  // Rời trang: beacon. `pagehide` bắt được cả trường hợp `beforeunload` bị bỏ qua
  // trên mobile Safari.
  useEffect(() => {
    const handleHide = () => {
      if (positionRef.current > 0) void send(true);
    };
    window.addEventListener("pagehide", handleHide);
    window.addEventListener("beforeunload", handleHide);
    return () => {
      window.removeEventListener("pagehide", handleHide);
      window.removeEventListener("beforeunload", handleHide);
      void send(true);
    };
  }, [send]);

  return {
    handleTimeUpdate,
    flushNow,
    progress,
    resumeSeconds: progress?.last_position_seconds ?? initialPositionSeconds,
  };
}

/** Cảnh báo dùng chung khi heartbeat không tới được server. */
export function notifyProgressOffline(): void {
  toast.warning("Chưa gửi được tiến độ. Hệ thống sẽ thử lại.");
}
