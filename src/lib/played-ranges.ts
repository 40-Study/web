/**
 * Khoảng "đã phát thật" cho heartbeat chống tua (contract §1).
 *
 * Vì sao phải gom ở client: server chỉ merge những gì client gửi lên. Nếu client
 * gửi `[[0, position]]` mỗi 10 giây thì mọi đoạn tua qua đều bị tính là đã học —
 * đúng thứ tính năng này tồn tại để chặn. Nên client phải tự biết "từ giây A tới
 * giây B vừa phát liên tục", và chỉ gửi những khoảng đó.
 *
 * Quy tắc gom: một mẫu `timeupdate` chỉ NỐI DÀI khoảng đang mở khi khoảng cách
 * giữa hai mẫu xấp xỉ thời gian thực trôi qua (`delta / playbackRate`). Nhảy
 * quá xa (seek, buffering dài, đổi tab) thì đóng khoảng cũ và mở khoảng mới —
 * đoạn nhảy qua không nằm trong khoảng nào nên không được tính.
 */

/** Một khoảng [start, end] tính bằng giây. */
export type PlayedRange = [number, number];

/** Nhịp gửi heartbeat theo contract §1 (10 giây/lần). */
export const HEARTBEAT_INTERVAL_MS = 10_000;

/**
 * Sàn tuyệt đối cho dung sai liên tục (giây) — bao dung tick rất ngắn/jitter
 * khi `expected` (xem `isContinuousSample`) gần 0.
 */
export const CONTINUITY_TOLERANCE_FLOOR_SECONDS = 0.75;

/**
 * Tỉ lệ dung sai TƯƠNG ĐỐI theo `expected` — review PR #17 đo được: một hằng
 * số tuyệt đối (1.5s cũ) cho một cú kéo tua chậm 1.5s/tick 40/40 mẫu bị chấm
 * "liên tục" (2x tín dụng gian lận), trong khi tick chậm 1s hoặc phát 2x lại
 * bị coi là gián đoạn dù là xem thật. Dung sai phải co giãn theo `expected`
 * (tốc độ phát × thời gian thực trôi qua), không phải một hằng số cố định.
 */
export const CONTINUITY_TOLERANCE_RATIO = 0.25;

/** Khoảng ngắn hơn ngưỡng này bị coi là nhiễu, không ghi vào khoảng đã phát. */
export const MIN_RANGE_SECONDS = 0.5;

/**
 * Chiều dài tối thiểu tuyệt đối cho MỌI khoảng do `openRange` tạo (xem giải
 * thích trong `boundedOpenCredit` ngay dưới đây) — chỉ để giữ khoảng hợp lệ
 * (không rỗng, không bị `mergeRanges` lọc mất), không phải một ngưỡng tín
 * dụng có ý nghĩa chống tua.
 */
export const MIN_OPEN_MARKER_SECONDS = 0.001;

/**
 * BLOCKER PR #17 vòng 2b: sàn `MIN_RANGE_SECONDS` áp dụng KHÔNG điều kiện cho
 * mọi khoảng mới — kể cả khoảng mở ra bởi một mẫu KHÔNG liên tục (kéo tua
 * chậm, spam phím tua). Review đo được: kéo 1.5s/tick 250ms hay spam +5s/tick
 * 200ms đều bị `isContinuousSample` từ chối đúng (0/40, 0/50 mẫu liên tục),
 * nhưng MỖI mẫu bị từ chối vẫn seed đúng 0.5s qua `openRange` — 40 mẫu × 0.5s
 * = 20s tín dụng trên 10s thực, không hề liên quan tới bao nhiêu thời gian
 * thực đã trôi qua.
 *
 * Tính lại: khoảng mở bởi một mẫu KHÔNG liên tục không được tín dụng nhiều
 * hơn `playbackRate × thời gian thực đã trôi qua kể từ mẫu trước` (chặn trên
 * theo wall-clock — không thể "xem" nhiều hơn thời gian thực tường đã trôi
 * qua, bất kể video nhảy bao xa). Sàn `MIN_RANGE_SECONDS` chỉ còn áp dụng khi
 * KHÔNG có mốc thời gian trước để so (mẫu đầu tiên của một lượt phát/đổi
 * bài) — đây là chi phí một lần, không lặp lại theo tick nên không gộp thành
 * gian lận đáng kể.
 */
export function boundedOpenCredit(
  elapsedMs: number | null,
  playbackRate: number,
  floor = MIN_RANGE_SECONDS
): number {
  if (elapsedMs === null || !Number.isFinite(elapsedMs)) return floor;
  const rate = playbackRate > 0 ? playbackRate : 1;
  const wallClockBound = (rate * Math.max(0, elapsedMs)) / 1000;
  // MIN_OPEN_MARKER_SECONDS: khi elapsedMs đo được xấp xỉ 0 (hai mẫu tới gần
  // như cùng lúc — có thể xảy ra thật khi `timeupdate` bắn dồn), chặn trên
  // wall-clock ra đúng 0 → `openRange` tạo khoảng RỖNG `[sample, sample]`, bị
  // `mergeRanges` LỌC MẤT hoàn toàn (đúng hợp đồng của nó — xem
  // `mergeRanges`). Mất khoảng này không chỉ mất 0 giây tín dụng (vô hại) mà
  // còn mất luôn "vị trí cuối" mà `appendSample` cần so — mẫu liên tục KẾ
  // TIẾP sẽ vô tình nối dài khoảng CŨ trước đó (còn sống sót trong mảng) xuyên
  // suốt đoạn vừa tua qua, mở lại đúng lỗ hổng hệ thống này tồn tại để chặn.
  // Giữ một sàn cực nhỏ (1ms — không đáng kể so với chặn trên wall-clock hay
  // sàn bootstrap) để khoảng luôn hợp lệ và giữ đúng vị trí.
  return Math.max(MIN_OPEN_MARKER_SECONDS, Math.min(floor, wallClockBound));
}

/** Chuẩn hoá về mảng khoảng hợp lệ, đã sắp xếp, đã gộp. */
export function mergeRanges(ranges: readonly PlayedRange[]): PlayedRange[] {
  const valid = ranges
    .filter(
      (r): r is PlayedRange =>
        Array.isArray(r) &&
        r.length === 2 &&
        Number.isFinite(r[0]) &&
        Number.isFinite(r[1]) &&
        r[1] > r[0]
    )
    .map((r) => [r[0], r[1]] as PlayedRange)
    .sort((a, b) => a[0] - b[0]);

  const merged: PlayedRange[] = [];
  for (const [start, end] of valid) {
    const last = merged[merged.length - 1];
    // `<=` chứ không `<`: hai khoảng dính sát nhau ([0,10] và [10,20]) là một
    // khoảng liền mạch khi tính tổng thời lượng.
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/**
 * Mở một khoảng MỚI, không đụng tới khoảng đang có.
 *
 * Dùng khi phát hiện gián đoạn (seek/buffering): mẫu này là điểm bắt đầu của một
 * khoảng mới, không phải bằng chứng nối dài khoảng trước. Khác `appendSample` ở
 * chỗ LUÔN đẻ khoảng mới thay vì nối vào khoảng cuối.
 */
export function openRange(
  ranges: readonly PlayedRange[],
  sample: number,
  minLength = MIN_RANGE_SECONDS
): PlayedRange[] {
  return mergeRanges([...ranges, [sample, sample + minLength] as PlayedRange]);
}

/**
 * Nối thêm một mẫu vào khoảng ĐANG MỞ.
 *
 * Gọi hàm này nghĩa là người gọi (`isContinuousSample`) ĐÃ xác nhận mẫu này nối
 * tiếp — hàm KHÔNG tự kiểm tra khoảng cách lần nữa. BLOCKER PR #17: bản trước
 * có ngưỡng tuyệt đối `sample <= last[1] + 0.5` độc lập với verdict liên tục,
 * nên một tick chậm (máy yếu, timeupdate 1s/lần) hoặc phát ở 2x bị cắt vụn
 * thành nhiều đoạn dưới 0.5s mỗi lần — mất tới 50% `watched_pct` dù xem thật
 * 100%. Muốn mở khoảng mới (mẫu KHÔNG liên tục), gọi `openRange`.
 */
export function appendSample(
  ranges: readonly PlayedRange[],
  sample: number,
  minLength = MIN_RANGE_SECONDS
): PlayedRange[] {
  const last = ranges[ranges.length - 1];
  if (!last) return openRange(ranges, sample, minLength);
  return mergeRanges([...ranges.slice(0, -1), [last[0], Math.max(last[1], sample)] as PlayedRange]);
}

/** Tổng thời lượng đã phát thật (giây) sau khi gộp. */
export function totalWatchedSeconds(ranges: readonly PlayedRange[]): number {
  return mergeRanges(ranges).reduce((sum, [start, end]) => sum + (end - start), 0);
}

/**
 * Mẫu `timeupdate` này có nối tiếp khoảng đang mở không?
 *
 * @param previousTime  thời điểm video ở mẫu trước
 * @param currentTime   thời điểm video ở mẫu này
 * @param playbackRate  tốc độ phát (1 = thường; 2 = video trôi nhanh gấp đôi)
 * @param elapsedMs     thời gian THỰC trôi qua giữa hai mẫu
 */
export function isContinuousSample(
  previousTime: number,
  currentTime: number,
  playbackRate: number,
  elapsedMs: number
): boolean {
  if (!Number.isFinite(previousTime) || !Number.isFinite(currentTime)) return false;

  const dtMedia = currentTime - previousTime;
  // Tua lùi hoặc đứng yên: không phải phát liên tục.
  if (dtMedia <= 0) return false;

  const rate = playbackRate > 0 ? playbackRate : 1;
  const dtWall = elapsedMs / 1000;
  const expected = rate * dtWall;
  // Dung sai TƯƠNG ĐỐI, không phải hằng số tuyệt đối (BLOCKER PR #17 — xem
  // hằng số ở trên): sàn cho tick ngắn/jitter, phần co giãn theo `expected` để
  // một cú kéo tua chậm (delta lớn hơn hẳn thời gian thực trôi qua) luôn bị
  // từ chối dù tick nhanh hay chậm.
  const tolerance = Math.max(CONTINUITY_TOLERANCE_FLOOR_SECONDS, CONTINUITY_TOLERANCE_RATIO * expected);
  return Math.abs(dtMedia - expected) <= tolerance;
}

/** Payload heartbeat đúng shape contract §1. */
export interface HeartbeatPayload {
  lesson_id?: string;
  position_seconds: number;
  duration_seconds: number;
  played_ranges: PlayedRange[];
}

export interface BuildHeartbeatPayloadInput {
  /** Bỏ trống với đường `PUT /lessons/:lessonId/progress` (id nằm ở URL). */
  lessonId?: string;
  positionSeconds: number;
  durationSeconds: number;
  /** Chỉ những khoảng MỚI kể từ lần gửi trước (server tự merge). */
  ranges: readonly PlayedRange[];
}

/** Dựng payload gửi lên; giây làm tròn về số nguyên, khoảng đã gộp trước khi gửi. */
export function buildHeartbeatPayload(
  input: BuildHeartbeatPayloadInput
): HeartbeatPayload {
  const duration = Math.max(0, Math.round(input.durationSeconds));
  const position = clamp(Math.round(input.positionSeconds), 0, duration);
  // Làm tròn RA NGOÀI (start xuống, end lên) — review vòng 1 (#19): làm tròn
  // cả hai đầu bằng `Math.round` không nhất quán: [10.2, 10.7] nở thành
  // [10, 11] (thêm 0.5s không phát thật), còn [10.6, 10.9] co thành [11, 11]
  // rồi bị lọc mất hẳn — "vừa thổi phồng vừa làm mất, tuỳ vị trí lẻ".
  // Chọn hướng RỘNG TAY (nhất quán, không tuỳ vị trí lẻ) thay vì chặt tay:
  // heartbeat gộp mỗi 10 giây nên khoảng NGẮN (< 1s) là bình thường — ví dụ
  // vài mẫu đầu trước nhịp gửi đầu tiên; làm tròn chặt sẽ xoá sạch những
  // khoảng ngắn đó (`ceil(start) > floor(end)` khi khoảng < 1s), mất tiến độ
  // thật nhiều hơn phần "thừa" tối đa 2s/khoảng mà cách này chấp nhận đổi lấy.
  const ranges = mergeRanges(input.ranges)
    .map(([start, end]): PlayedRange => [
      clamp(Math.floor(start), 0, duration),
      clamp(Math.ceil(end), 0, duration),
    ])
    .filter(([start, end]) => end > start);

  const payload: HeartbeatPayload = {
    position_seconds: position,
    duration_seconds: duration,
    played_ranges: ranges,
  };
  if (input.lessonId) payload.lesson_id = input.lessonId;
  return payload;
}

/** Khoảng chưa gửi được (mất mạng) — giữ lại để gửi kèm lần heartbeat sau. */
export function pendingAfterFailure(
  alreadyPending: readonly PlayedRange[],
  justAttempted: readonly PlayedRange[]
): PlayedRange[] {
  return mergeRanges([...alreadyPending, ...justAttempted]);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}
