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
 * Sai số cho phép giữa "thời gian thực trôi qua" và "thời gian video nhảy".
 * Tick `timeupdate` không đều (thường 250ms, có thể 1s khi mạng chậm), nên cần
 * một biên độ. 1.5s đủ rộng cho tick chậm và đủ hẹp để một cú seek 5s bị chặn.
 */
export const CONTINUITY_TOLERANCE_SECONDS = 1.5;

/** Khoảng ngắn hơn ngưỡng này bị coi là nhiễu, không ghi vào khoảng đã phát. */
export const MIN_RANGE_SECONDS = 0.5;

/**
 * Bước tiến tối thiểu giữa hai mẫu để được coi là "đang phát".
 * Tick `timeupdate` là 250ms ở điều kiện tốt, nên ngưỡng phải nhỏ hơn thế nhiều;
 * đây chỉ để chặn trường hợp video đứng yên mà thời gian thực vẫn trôi.
 */
export const MIN_TICK_SECONDS = 0.05;

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
 * Nối thêm một mẫu vào danh sách khoảng, trả về danh sách mới.
 *
 * Mẫu đơn lẻ được biểu diễn bằng khoảng dài tối thiểu — `mergeRanges` bỏ qua
 * khoảng có `end <= start`, nên `[t, t]` sẽ biến mất nếu không nới ra.
 */
export function appendSample(
  ranges: readonly PlayedRange[],
  sample: number,
  minLength = MIN_RANGE_SECONDS
): PlayedRange[] {
  const last = ranges[ranges.length - 1];
  // Mẫu nằm trong (hoặc sát) khoảng đang mở → nối dài, không đẻ khoảng mới.
  if (last && sample >= last[0] && sample <= last[1] + minLength) {
    return mergeRanges([...ranges.slice(0, -1), [last[0], Math.max(last[1], sample)] as PlayedRange]);
  }
  return mergeRanges([...ranges, [sample, sample + minLength] as PlayedRange]);
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

  const delta = currentTime - previousTime;
  // Tua lùi hoặc đứng yên: không phải phát liên tục.
  if (delta <= 0) return false;

  const rate = playbackRate > 0 ? playbackRate : 1;
  const expected = (elapsedMs / 1000) * rate;
  const lower = Math.max(MIN_TICK_SECONDS, expected - CONTINUITY_TOLERANCE_SECONDS);
  const upper = expected + CONTINUITY_TOLERANCE_SECONDS;
  return delta >= lower && delta <= upper;
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
  const ranges = mergeRanges(input.ranges)
    .map(([start, end]): PlayedRange => [
      clamp(Math.round(start), 0, duration),
      clamp(Math.round(end), 0, duration),
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
