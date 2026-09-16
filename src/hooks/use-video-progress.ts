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
  WALL_CLOCK_CREDIT_SLACK,
  appendSample,
  boundedOpenCredit,
  buildHeartbeatPayload,
  creditedEndForContinuousSample,
  isContinuousSample,
  mergeRanges,
  openRange,
  pendingAfterFailure,
  splitByWallClockCap,
  withOpenRangeMarker,
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
  const lastSampleRef = useRef<{ time: number; at: number } | null>(null);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const playbackRateRef = useRef(1);
  const lessonIdRef = useRef(lessonId);
  const onProgressChangeRef = useRef(onProgressChange);
  const inFlightRef = useRef(false);
  /** Chặn spam toast mất mạng — mỗi lần heartbeat lỗi (10s/lần) không cần báo lại. */
  const lastOfflineToastAtRef = useRef(0);
  /**
   * V-H tái review lần 3 (gate #17 vòng 3, BUG THẬT — test đo được đúng NỬA
   * tiến độ, 200/400): mốc cũ `lastSendAtRef` (thời điểm GỬI gần nhất, dù có
   * bị trần cắt hay không) SAI khi có `leftover` tồn đọng — mỗi lần gửi (kể
   * cả gửi bị cắt bớt) đều reset mốc về "bây giờ", nên trần của lần gửi KẾ
   * TIẾP chỉ tính theo khoảng cách tới heartbeat TRƯỚC ĐÓ (~10s), không phản
   * ánh việc `leftover` đã tồn đọng từ RẤT LÂU trước đó — hệ quả: một backlog
   * lớn (do `inFlightRef` giữ nhịp gửi thưa hơn bình thường) không bao giờ
   * được phép "bắt kịp", vì trần luôn bị giữ ở mức ~1 cửa sổ 10s/lần dù thời
   * gian thực đã trôi qua đủ để giải thích toàn bộ backlog đó.
   *
   * `pendingSinceRef` thay thế: mốc thời gian THẬT khi khoảng ĐẦU TIÊN của
   * batch hiện đang CHỜ GỬI bắt đầu tích luỹ (đặt trong `handleTimeUpdate`,
   * chỉ khi đang từ trạng thái không có gì chờ). Chỉ reset về `null` khi biết
   * chắc một lần gửi đã THÀNH CÔNG và không còn `leftover` nào — còn nguyên
   * nếu vẫn còn `leftover` (kể cả nếu lần gửi đó thất bại), để trần lần sau
   * lớn dần đúng theo thời gian thực đã trôi qua, cho tới khi đủ để gửi hết
   * backlog trong một lần.
   */
  const pendingSinceRef = useRef<number | null>(null);

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  const send = useCallback(async (useBeacon = false) => {
    if (inFlightRef.current && !useBeacon) return;
    if (durationRef.current <= 0) return;

    // V-H: trần TỔNG cho payload này — thời gian thực trôi qua kể từ khi
    // khoảng CŨ NHẤT còn đang chờ gửi bắt đầu tích luỹ (`pendingSinceRef`,
    // KHÔNG phải "lần gửi gần nhất" — xem giải thích tại khai báo ref) ×
    // playbackRate hiện tại × (1+slack). Rộng rãi có chủ đích với thời gian
    // rảnh/tạm dừng (không phát) — trần chỉ cần đủ LỚN để không bao giờ cắt
    // hụt phần xem thật, việc cắt phần gian lận đã do `boundedOpenCredit`
    // (mỗi mẫu) và trần wall-clock ở `handleTimeUpdate` (nhánh liên tục, xem
    // V-F) đảm nhiệm từ trước khi tới đây.
    const wallClockSecondsPending =
      pendingSinceRef.current === null
        ? 0
        : Math.max(0, (Date.now() - pendingSinceRef.current) / 1000);
    const rate = playbackRateRef.current > 0 ? playbackRateRef.current : 1;
    const maxTotalSeconds = rate * wallClockSecondsPending * (1 + WALL_CLOCK_CREDIT_SLACK);

    // V-H tái review (gate #17 vòng 3 lần 2, BUG THẬT): trần wall-clock chỉ
    // được phép chặn TỐC ĐỘ một lần gửi, KHÔNG được làm mất tiến độ thật —
    // trước đây `rangesRef.current = []` xoá cả phần bị `buildHeartbeatPayload`
    // cắt bớt do trần này, nên khi một lần gửi bị trần cắt (VD: `inFlightRef`
    // giữ nhịp gửi thưa hơn 10s bình thường, tích luỹ nhiều tiến độ thật hơn
    // trần một lần gửi cho phép), phần vượt trần biến mất vĩnh viễn thay vì
    // được gửi ở nhịp sau. Tách trước bằng `splitByWallClockCap` ở chính tầng
    // này để biết chính xác phần nào đã đưa vào payload (`included`) và phần
    // nào phải giữ lại (`leftover`).
    const merged = mergeRanges(rangesRef.current);
    const { included, leftover } = splitByWallClockCap(merged, maxTotalSeconds);

    const payload = buildHeartbeatPayload({
      lessonId: lessonIdRef.current,
      positionSeconds: positionRef.current,
      durationSeconds: durationRef.current,
      ranges: included,
    });

    // Không có gì mới thì không bắn request rỗng làm phiền server.
    if (!useBeacon && payload.played_ranges.length === 0) return;

    // Chỉ xoá phần ĐÃ ĐƯA VÀO payload này — `leftover` (phần bị trần cắt bớt)
    // phải còn nguyên trong buffer để gửi ở nhịp heartbeat kế tiếp.
    //
    // V-G tái review (gate #17 vòng 3): `leftover` giữ được NỘI DUNG chưa gửi
    // nhưng KHÔNG giữ được VỊ TRÍ ĐANG PHÁT — sau lần gửi đầu tiên nó chỉ còn
    // đoạn đuôi ngắn, cách vị trí media hiện tại nguyên một nhịp heartbeat, xa
    // hơn `POSITION_MATCH_TOLERANCE_SECONDS`. Không có marker dưới đây,
    // `appendSample` mất mốc và mở khoảng mới mỗi nhịp → dải đang xem bị cắt
    // thành từng mảnh ~10s và phần giữa bị BỎ HẲN khi lên dây (mảnh sau ngắn
    // hơn 10s bị floor/lọc) — đo được đúng một nửa tiến độ (200/400).
    // `lastSampleRef.current.time` là vị trí media THẬT của mẫu gần nhất (chỉ
    // `timeupdate` mới ghi vào ref này, nên một heartbeat chen vào giữa không
    // đẩy nó lệch đi như `positionRef`).
    rangesRef.current = withOpenRangeMarker(leftover, lastSampleRef.current?.time ?? null);

    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const body = new Blob([JSON.stringify(payload)], { type: "application/json" });
      // `sendBeacon` bắn vào path tương đối của trang; backend proxy `/api` nhận ở đây.
      navigator.sendBeacon("/api/progress", body);
      // Không có tín hiệu lỗi từ sendBeacon — coi như đã gửi. Chỉ reset mốc
      // "đang chờ từ khi nào" nếu KHÔNG còn leftover (gửi hết sạch); còn
      // leftover thì giữ nguyên mốc gốc để lần sau trần tính đúng.
      if (leftover.length === 0) pendingSinceRef.current = null;
      return;
    }

    inFlightRef.current = true;
    try {
      // BLOCKER review vòng 1 (#8, Q4): heartbeat chỉ gửi đúng 3 field contract
      // §1 — `status` KHÔNG có trong body. Trước đây gửi `status: "in_progress"`
      // mỗi 10s; nếu backend lỡ áp field này thay vì tự tính lại từ
      // `watched_pct`, một bài đã `completed` có thể bị đẩy ngược `in_progress`.
      const response = await enrollmentService.updateProgress(lessonIdRef.current, {
        position_seconds: payload.position_seconds,
        duration_seconds: payload.duration_seconds,
        played_ranges: payload.played_ranges,
      });
      setProgress(response);
      onProgressChangeRef.current?.(response);
      // Gửi thành công — chỉ reset mốc nếu không còn leftover (xem giải
      // thích ở nhánh beacon phía trên).
      if (leftover.length === 0) pendingSinceRef.current = null;
    } catch {
      // Mất mạng: giữ khoảng lại để gửi kèm lần sau, không mất tiến độ.
      // `justSent` đã bị rút khỏi `rangesRef` trước khi gửi, nên phải cộng lại
      // đúng khoảng vừa gửi hỏng — SSOT là `rangesRef`, không có bộ giữ thứ hai
      // (review vòng 1, #11: `pendingRef` cũ bị ghi nhưng không nơi nào đọc).
      rangesRef.current = pendingAfterFailure(rangesRef.current, payload.played_ranges);
      // V-H: CỐ Ý KHÔNG đụng `pendingSinceRef` ở đây (dù `leftover` rỗng) —
      // gửi thất bại nghĩa là NỘI DUNG VỪA GỬI (giờ được cộng lại vào buffer
      // ở dòng trên) vẫn còn tồn đọng thật, mốc "đang chờ từ khi nào" phải
      // giữ nguyên để cửa sổ wall-clock cộng dồn qua các lần thử lại — nếu
      // không, lần gửi kế tiếp sẽ tính trần chỉ theo khoảng thời gian RETRY
      // (ngắn), cắt hụt đúng phần tồn đọng hợp lệ vừa được giữ lại.

      // Báo người học biết tiến độ chưa gửi được (review vòng 1, #11:
      // `notifyProgressOffline` từng được export nhưng không ai gọi). Debounce
      // 30s để không spam toast mỗi lần heartbeat lỗi (10s/lần).
      const now = Date.now();
      if (now - lastOfflineToastAtRef.current > 30_000) {
        lastOfflineToastAtRef.current = now;
        notifyProgressOffline();
      }
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  /**
   * Đổi bài (BLOCKER review vòng 1, #10): flush khoảng còn lại của bài CŨ
   * TRƯỚC khi state bị reset cho bài mới. Cleanup của effect này chạy đúng lúc
   * `lessonId` đổi — trước khi effect setup cho giá trị mới thực thi — nên
   * `lessonIdRef`/`rangesRef` lúc đó vẫn còn giữ dữ liệu của bài CŨ. Không
   * flush ở đây thì tối đa 10 giây tiến độ thật (một nhịp heartbeat) mất mỗi
   * lần bấm "Bài tiếp theo" liên tục.
   */
  useEffect(() => {
    lessonIdRef.current = lessonId;
    rangesRef.current = [];
    lastSampleRef.current = null;
    positionRef.current = 0;
    durationRef.current = 0;
    // Đổi bài reset luôn mốc "đang chờ gửi từ khi nào" — bài mới bắt đầu từ
    // trạng thái không có gì tồn đọng (khoảng của bài CŨ đã được `send(true)`
    // ở cleanup dưới đây flush trước khi effect này chạy).
    pendingSinceRef.current = null;
    setProgress(null);

    return () => {
      void send(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const handleTimeUpdate = useCallback(
    (currentTime: number, playbackRate: number, durationSeconds?: number) => {
      const now = Date.now();
      durationRef.current = Math.max(durationRef.current, durationSeconds ?? 0, currentTime);
      positionRef.current = currentTime;
      playbackRateRef.current = playbackRate;

      // V-H tái review lần 3: đánh dấu mốc THẬT khi batch đang chờ gửi bắt
      // đầu tích luỹ — CHỈ đặt khi chưa có gì chờ (`pendingSinceRef` đang
      // `null`, nghĩa là buffer vừa được gửi hết sạch hoặc mới khởi tạo).
      // Cả hai nhánh dưới đây (liên tục lẫn mở khoảng mới) đều thêm nội dung
      // vào `rangesRef.current`, nên mốc này phải có TRƯỚC khi chạy tới đó.
      if (pendingSinceRef.current === null) {
        pendingSinceRef.current = now;
      }

      const previous = lastSampleRef.current;
      lastSampleRef.current = { time: currentTime, at: now };

      // Mẫu đầu tiên sau khi gắn video chỉ mở khoảng, không nối dài — chưa có
      // mốc trước để so, nên coi nó là điểm bắt đầu chứ không phải bằng chứng
      // của một khoảng đã phát.
      if (previous && isContinuousSample(previous.time, currentTime, playbackRate, now - previous.at)) {
        // V-F (re-review vòng 2, CHẶN): nhánh liên tục trước đây cộng TRỌN
        // `currentTime - previous.time` — dung sai của `isContinuousSample`
        // (dù đã hạ sàn) vẫn cho qua một khoảng dtMedia LỚN HƠN thời gian
        // thực trôi qua (`dtWall`) một chút; cộng trọn phần đó vẫn là tín
        // dụng vượt mức. Trần wall-clock từng mẫu nằm ở
        // `creditedEndForContinuousSample` (dùng chung với test, xem ở đó).
        const creditedEnd = creditedEndForContinuousSample(
          previous.time,
          currentTime,
          playbackRate,
          now - previous.at
        );
        // V-G tái review (gate #17 vòng 3): `previous.time` có thể đã bị một
        // lần gửi heartbeat rút khỏi buffer (xem `withOpenRangeMarker` ở
        // `send()`), nên nó có thể nằm TRƯỚC đầu khoảng đang mở cả một nhịp
        // gửi. Không có marker đó, `appendSample` không tìm thấy khoảng nào
        // (`bestIndex === -1`) và mở khoảng mới mỗi nhịp, bỏ hẳn phần giữa.
        rangesRef.current = appendSample(rangesRef.current, previous.time, creditedEnd);
        return;
      }
      // Seek / buffering / mẫu đầu: đoạn nhảy qua KHÔNG được tính, nhưng những
      // khoảng đã gom trước đó thì vẫn giữ — `openRange` chứ không phải reset.
      // BLOCKER PR #17 vòng 2b: khoảng mới không được tín dụng nhiều hơn thời
      // gian thực đã trôi qua kể từ mẫu trước × playbackRate — nếu không, một
      // mẫu KHÔNG liên tục lặp lại liên tục (kéo tua chậm, spam phím tua) vẫn
      // seed đều 0.5s mỗi lần dù chẳng có giây thực nào trôi qua tương ứng.
      const elapsedMs = previous ? now - previous.at : null;
      rangesRef.current = openRange(
        rangesRef.current,
        currentTime,
        boundedOpenCredit(elapsedMs, playbackRate)
      );
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
