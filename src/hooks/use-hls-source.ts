"use client";

/**
 * Gắn nguồn video (HLS hoặc file thường) vào một `<video>` và xử lý URL KÝ hết hạn (S1, QA 260929).
 *
 * `/api/hls/*` chỉ phục vụ URL có chữ ký ngắn hạn (xem `lib/hls-playback.ts`). Giữa lúc xem, chữ ký
 * có thể hết hạn — backend trả 403. Khi đó hook gọi `refreshSource` ĐÚNG MỘT LẦN để lấy URL ký mới
 * (thường là refetch API nội dung bài học), nạp lại đúng vị trí đang xem. Xin mới mà vẫn lỗi, hoặc
 * không xin được, thì `error` mang thông báo tiếng Việt để player hiển thị — không để khung trắng.
 *
 * Bộ đếm "đã xin lại" được đặt lại khi phát lại thành công (segment tải được), nên hết hạn lần
 * thứ hai sau vài giờ vẫn được xin lại một lần nữa.
 */

import { useEffect, useRef, useState, type RefObject } from "react";
import type { HlsConfig } from "hls.js";
import { isHlsAuthFailure, playbackErrorMessage } from "@/lib/hls-playback";

export interface UseHlsSourceOptions {
  /** Vị trí bắt đầu (giây). Đổi giá trị này nạp lại nguồn — giữ đúng hành vi cũ của player. */
  startPosition?: number;
  /** Tự phát khi manifest sẵn sàng (cửa sổ xem thử); player chính để người dùng bấm phát. */
  autoPlay?: boolean;
  /** Xin URL ký mới khi bị 403. Trả `null`/throw nếu không xin được. */
  refreshSource?: () => Promise<string | null | undefined>;
  hlsConfig?: Partial<HlsConfig>;
}

/** URL bỏ query (chữ ký) — hai URL ký của cùng một video có cùng khoá này. */
function resourceKeyOf(url: string): string {
  const i = url.indexOf("?");
  return i < 0 ? url : url.slice(0, i);
}

export function useHlsSource(
  videoRef: RefObject<HTMLVideoElement>,
  src: string | null,
  { startPosition = 0, autoPlay = false, refreshSource, hlsConfig }: UseHlsSourceOptions = {}
): { error: string | null } {
  const [error, setError] = useState<string | null>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(src);
  // Đợi `<video>` gắn vào DOM (Dialog/Portal có thể mount trễ một nhịp so với effect).
  const [mountTick, setMountTick] = useState(0);

  const refreshedRef = useRef(false);
  const resourceKeyRef = useRef<string | null>(src ? resourceKeyOf(src) : null);
  const errorRef = useRef<string | null>(null);
  errorRef.current = error;
  const resumeAtRef = useRef<number | null>(null);
  // Giữ bản mới nhất mà không nạp lại player mỗi lần cha render (callback thường là closure mới).
  const refreshRef = useRef(refreshSource);
  refreshRef.current = refreshSource;
  const hlsConfigRef = useRef(hlsConfig);
  hlsConfigRef.current = hlsConfig;

  // Đồng bộ với prop `src`. Cha refetch nội dung bài học (đổi tab, quay lại cửa sổ...) sẽ nhận URL
  // ký MỚI cho cùng một video: chỉ chữ ký đổi thì KHÔNG nạp lại — nếu không mỗi lần refetch video
  // sẽ nhảy về đầu. Chữ ký mới chỉ được dùng khi (a) là video khác, hoặc (b) player đang báo lỗi
  // (tự hồi phục khi cha đã có URL ký còn hạn). Hết hạn giữa chừng do onAuthFailure xử lý.
  useEffect(() => {
    const key = src ? resourceKeyOf(src) : null;
    if (src !== null && key === resourceKeyRef.current && !errorRef.current) return;
    resourceKeyRef.current = key;
    refreshedRef.current = false;
    setError(null);
    setActiveSrc(src);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!activeSrc) return;
    if (!video) {
      const id = requestAnimationFrame(() => setMountTick((n) => n + 1));
      return () => cancelAnimationFrame(id);
    }

    let cancelled = false;
    let hls: { destroy: () => void } | null = null;
    const startAt = resumeAtRef.current ?? startPosition;
    resumeAtRef.current = null;

    // URL có chữ ký -> lỗi này là hết hạn; URL ngoài hệ thống (không ký) thì chỉ là tải hỏng.
    const failKind = activeSrc.includes("sig=") ? "expired" : "failed";
    const onAuthFailure = async () => {
      const resumeAt = video.currentTime || startAt;
      if (refreshedRef.current || !refreshRef.current) {
        if (!cancelled) setError(playbackErrorMessage(failKind));
        return;
      }
      refreshedRef.current = true;
      try {
        const next = await refreshRef.current();
        if (cancelled) return;
        if (!next || next === activeSrc) {
          setError(playbackErrorMessage(failKind));
          return;
        }
        resumeAtRef.current = resumeAt;
        setActiveSrc(next);
      } catch {
        if (!cancelled) setError(playbackErrorMessage(failKind));
      }
    };

    if (activeSrc.includes(".m3u8")) {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          const instance = new Hls({ startPosition: startAt, ...hlsConfigRef.current });
          hls = instance;
          let mediaRecovered = false;
          instance.on(Hls.Events.FRAG_LOADED, () => {
            refreshedRef.current = false;
          });
          if (autoPlay) {
            instance.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {});
            });
          }
          instance.on(Hls.Events.ERROR, (_event, data) => {
            // 403 ở BẤT KỲ lỗi nào (kể cả chưa fatal) = chữ ký bị từ chối; hls.js không tự thử lại 4xx.
            if (isHlsAuthFailure(data)) {
              instance.destroy();
              hls = null;
              void onAuthFailure();
              return;
            }
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !mediaRecovered) {
              mediaRecovered = true;
              instance.recoverMediaError();
              return;
            }
            instance.destroy();
            hls = null;
            // Manifest không phải m3u8 (vd backend trả 202 "đang xử lý") -> nói rõ lý do.
            setError(
              playbackErrorMessage(
                data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR ? "processing" : "failed"
              )
            );
          });
          instance.loadSource(activeSrc);
          instance.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari phát HLS gốc — không có sự kiện 403 chi tiết, coi lỗi media là có thể hết hạn.
          video.src = activeSrc;
          video.onerror = () => void onAuthFailure();
          if (startAt > 0) video.currentTime = startAt;
          if (autoPlay) video.play().catch(() => {});
        } else {
          setError(playbackErrorMessage("failed"));
        }
      });
    } else {
      video.src = activeSrc;
      video.onerror = () => void onAuthFailure();
      if (startAt > 0) video.currentTime = startAt;
      if (autoPlay) video.play().catch(() => {});
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      video.onerror = null;
    };
  }, [activeSrc, startPosition, autoPlay, videoRef, mountTick]);

  return { error };
}
