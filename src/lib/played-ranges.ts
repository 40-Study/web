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
 *
 * V-F (re-review vòng 2 web PR #17): sàn cũ 0.75s đủ rộng để một cú kéo tua
 * đều 0.9s/tick 250ms (rate 1, expected 0.25) vẫn lọt qua thành "liên tục"
 * (|0.9-0.25|=0.65 ≤ 0.75) — 4x tín dụng gian lận. Hạ sàn xuống 0.25s để
 * kịch bản này bị `isContinuousSample` từ chối ngay ở bước phân loại. Sàn
 * này chỉ còn có ý nghĩa với `expected` rất nhỏ (tick cực ngắn), không đủ để
 * tự nó gây lỗ khai thác nữa — nhánh liên tục còn có thêm trần wall-clock ở
 * `handleTimeUpdate` (xem V-F) làm lớp chặn thứ hai.
 */
export const CONTINUITY_TOLERANCE_FLOOR_SECONDS = 0.25;

/**
 * Hệ số nới cho trần wall-clock của MỖI mẫu (liên tục hay không) — V-F: tín
 * dụng một mẫu không được vượt quá `playbackRate × dtWall × (1 + hệ số này)`.
 * 5% dư ra để hấp thụ sai số làm tròn/jitter đo thời gian, không phải một kẽ
 * hở tín dụng.
 */
export const WALL_CLOCK_CREDIT_SLACK = 0.05;

/**
 * Dung sai (giây) khi tìm khoảng "chứa hoặc kề" một vị trí trong `appendSample`
 * (V-G). Không dùng bằng-tuyệt-đối vì trần wall-clock (V-F) có thể khiến đầu
 * cuối một khoảng đang mở tụt lại một chút so với vị trí media THẬT ở mẫu
 * trước (`previousTime`) khi tín dụng bị cắt liên tục nhiều tick — độ trễ đó
 * bị chặn trên bởi chính trần wall-clock (tối đa vài phần mười giây mỗi
 * tick), nên một dung sai nhỏ vài giây là đủ an toàn và KHÔNG đủ lớn để nhầm
 * sang một khoảng khác thật sự ở xa (một cú tua luôn cách hàng chục giây trở
 * lên, xem hàm `isContinuousSample` — `appendSample` chỉ được gọi khi hàm đó
 * đã xác nhận liên tục).
 */
export const POSITION_MATCH_TOLERANCE_SECONDS = 2;

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
 *
 * V-G (re-review vòng 2, HỒI QUY): bản trước chọn khoảng để nối bằng
 * `ranges[ranges.length - 1]` — nhưng `mergeRanges` luôn sắp theo `start`
 * TĂNG DẦN, nên phần tử cuối là khoảng có `start` LỚN NHẤT, không phải khoảng
 * đang phát. Kịch bản vỡ: xem 500→600 (`[[500,600]]`), tua lùi về 100 (mở
 * khoảng mới `[[100,100.25],[500,600]]` — mảng vẫn có `[500,600]` ở cuối vì
 * `start` của nó lớn hơn), xem tiếp 100→500: mọi mẫu liên tục nối vào phần tử
 * CUỐI (`[500,600]`) bằng `Math.max(600, sample)` — không đổi gì cho tới khi
 * playhead vượt 600. 400 giây xem thật bị ghi 0 giây.
 *
 * Sửa: chọn khoảng theo VỊ TRÍ — khoảng chứa `previousTime` (vị trí media ở
 * mẫu TRƯỚC, không phải mẫu hiện tại), hoặc gần nhất trong
 * `POSITION_MATCH_TOLERANCE_SECONDS`. Không tìm thấy khoảng nào phù hợp (mẫu
 * đầu tiên, hoặc dữ liệu bất thường) thì coi như mở khoảng mới — an toàn hơn
 * nối nhầm vào một khoảng không liên quan.
 */
export function appendSample(
  ranges: readonly PlayedRange[],
  previousTime: number,
  sample: number,
  minLength = MIN_RANGE_SECONDS
): PlayedRange[] {
  const merged = mergeRanges(ranges);
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < merged.length; i += 1) {
    const [start, end] = merged[i];
    if (previousTime >= start && previousTime <= end) {
      // Chứa hẳn — không khoảng nào khác cùng chứa (đã merge, không chồng lấn).
      bestIndex = i;
      bestDistance = 0;
      break;
    }
    const distance = previousTime > end ? previousTime - end : start - previousTime;
    if (distance <= POSITION_MATCH_TOLERANCE_SECONDS && distance < bestDistance) {
      bestIndex = i;
      bestDistance = distance;
    }
  }

  if (bestIndex === -1) return openRange(merged, sample, minLength);

  const [start, end] = merged[bestIndex];
  const next = [...merged];
  next[bestIndex] = [Math.min(start, sample), Math.max(end, sample)];
  return mergeRanges(next);
}

/**
 * Đầu cuối được GHI cho một mẫu LIÊN TỤC (V-F) — chặn trên theo wall-clock.
 *
 * `isContinuousSample` cho qua một băng dung sai quanh `expected`, nên một mẫu
 * vẫn có thể có `dtMedia` LỚN HƠN thời gian thực đã trôi qua một chút (trong
 * băng đó). Cộng trọn phần đó vẫn là tín dụng vượt mức, nên đầu cuối bị kẹp về
 * `previousTime + playbackRate × dtWall × (1 + WALL_CLOCK_CREDIT_SLACK)`: tín
 * dụng vượt trần bị CẮT về đúng trần (mẫu vẫn là liên tục, chỉ giới hạn LƯỢNG
 * được ghi), không bị từ chối hoàn toàn.
 *
 * Tách thành hàm riêng vì đây là một trong HAI lớp của fix V-F và trước đây
 * biểu thức này bị chép lại ở cả hook lẫn helper `simulate()` của test — chép
 * lại nghĩa là mutation vào bản này không được bản kia phát hiện.
 */
export function creditedEndForContinuousSample(
  previousTime: number,
  currentTime: number,
  playbackRate: number,
  elapsedMs: number
): number {
  const dtWall = elapsedMs / 1000;
  const rate = playbackRate > 0 ? playbackRate : 1;
  return Math.min(currentTime, previousTime + rate * dtWall * (1 + WALL_CLOCK_CREDIT_SLACK));
}

/** Tổng thời lượng đã phát thật (giây) sau khi gộp. */
export function totalWatchedSeconds(ranges: readonly PlayedRange[]): number {
  return mergeRanges(ranges).reduce((sum, [start, end]) => sum + (end - start), 0);
}

/**
 * V-G tái review (gate #17 vòng 3): giữ lại MARKER VỊ TRÍ của khoảng đang mở
 * trong buffer trước khi `rangesRef` bị gán lại sau một lần gửi.
 *
 * `send()` rút phần đã gửi khỏi buffer, để lại `leftover` — mà `leftover` chỉ
 * chứa phần CHƯA gửi, nên đầu cuối của nó KHÔNG phải vị trí media hiện tại.
 * Sau khi gửi, vị trí media của mẫu kế tiếp nằm một nhịp heartbeat (~
 * `HEARTBEAT_INTERVAL_MS`) về phía trước đầu cuối đó; khoảng cách này vượt
 * `POSITION_MATCH_TOLERANCE_SECONDS` (2s) nên `appendSample` trả `bestIndex
 * === -1` và mở khoảng MỚI — cú "mở khoảng mới" này lặp lại mỗi nhịp, cắt dải
 * đang xem thành từng mảnh ~10s và **bỏ hẳn** khoảng giữa các mảnh (mảnh sau
 * ngắn hơn 10s bị `buildHeartbeatPayload` làm tròn vào trong rồi lọc bỏ).
 * Marker
 * dưới `MIN_RANGE_SECONDS` không bao giờ tự lọt lên dây (bị floor/lọc), nhưng
 * đủ để `appendSample` tìm thấy và giữ đúng vị trí.
 *
 * Marker phải được thêm CẢ KHI `leftover` RỖNG (đã gửi hết): đó chính là
 * trường hợp buffer bị xoá sạch, và không có marker thì mẫu liên tục kế tiếp
 * lại rơi vào nhánh mở-khoảng-mới.
 */
export function withOpenRangeMarker(
  ranges: readonly PlayedRange[],
  position: number | null,
  marker = MIN_OPEN_MARKER_SECONDS
): PlayedRange[] {
  if (position === null || !Number.isFinite(position)) return [...ranges];
  return mergeRanges([...ranges, [position, position + marker] as PlayedRange]);
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
  /**
   * V-H (re-review vòng 2 web PR #17, CHẶN): trần TỔNG chiều dài
   * `played_ranges` trong payload này — `playbackRate × thời gian thực trôi
   * qua kể từ lần gửi trước × (1 + WALL_CLOCK_CREDIT_SLACK)`. Không truyền
   * (hoặc `Infinity`) nghĩa là không chặn (test đơn lẻ không quan tâm tầng
   * payload). Caller thật (`use-video-progress.ts`) LUÔN truyền giá trị này.
   *
   * V-J (gate #17 vòng 4): trần được áp SAU bước làm tròn vào trong, nên nó
   * đo đúng tổng đi lên dây. Ý nghĩa đại lượng không đổi (ngân sách theo
   * wall-clock) — làm tròn vào trong chỉ thu nhỏ, nên cùng một trần giờ là
   * chặn trên CHẶT hơn so với khi đo trên mảng thô.
   */
  maxTotalSeconds?: number;
}

/**
 * Tách `ranges` (đã sắp theo `start` tăng dần) thành phần NẰM TRONG trần
 * wall-clock của MỘT LẦN GỬI (`included` — dùng để dựng payload) và phần
 * VƯỢT trần (`leftover`). Giữ các khoảng SỚM NHẤT trước, cắt ngắn đúng
 * khoảng chạm trần (phần bị cắt đi vào `leftover`, không phải bị bỏ hẳn).
 *
 * Hàm thuần trên giá trị nhận vào — nó không biết gì về số nguyên hay làm
 * tròn. Người gọi quyết định nó đo cái gì:
 *  - `buildHeartbeatPayload` gọi nó SAU khi làm tròn vào trong (V-J), nên ở
 *    đó trần đo đúng con số đi lên dây;
 *  - hook (`use-video-progress.ts`) gọi nó trên mảng THÔ, chỉ để biết phần nào
 *    đã đưa vào payload và phần nào phải giữ lại cho nhịp sau.
 *
 * V-H tái review (gate #17 vòng 3 lần 2, BUG THẬT phát hiện qua test): bản
 * trước (`capTotalByWallClock`, chỉ trả `included`) khiến hook
 * (`use-video-progress.ts`) xoá TOÀN BỘ `rangesRef.current` sau mỗi lần gửi
 * bất kể có bị trần này cắt hay không — phần VƯỢT trần (ví dụ xem liên tục
 * hàng trăm giây thật trong khi trần MỘT payload chỉ cho phép ~10s, do
 * `inFlightRef` giữ nhịp gửi thưa hơn bình thường) bị MẤT VĨNH VIỄN thay vì
 * được gửi ở nhịp heartbeat SAU. Trần này chỉ có ý nghĩa CHẶN TỐC ĐỘ một lần
 * gửi (chống một payload đơn lẻ mang quá nhiều do lỗi làm tròn/nở — xem
 * comment ở `buildHeartbeatPayload`), KHÔNG được phép làm mất TỔNG tiến độ
 * thật đã xem — khác hẳn `boundedOpenCredit`/trần liên tục (V-F), vốn chặn
 * đúng TÍN DỤNG NGHI VẤN GIAN LẬN (được phép mất vĩnh viễn, đó chính là mục
 * đích chống tua). Người gọi (hook) chịu trách nhiệm giữ lại `leftover`.
 */
export function splitByWallClockCap(
  ranges: readonly PlayedRange[],
  maxTotalSeconds: number
): { included: PlayedRange[]; leftover: PlayedRange[] } {
  if (!Number.isFinite(maxTotalSeconds) || maxTotalSeconds < 0) {
    return { included: [...ranges], leftover: [] };
  }

  const included: PlayedRange[] = [];
  const leftover: PlayedRange[] = [];
  let total = 0;
  for (const [start, end] of ranges) {
    if (total >= maxTotalSeconds) {
      leftover.push([start, end]);
      continue;
    }
    const length = end - start;
    const remaining = maxTotalSeconds - total;
    if (length <= remaining) {
      included.push([start, end]);
      total += length;
    } else {
      const splitPoint = start + remaining;
      included.push([start, splitPoint]);
      leftover.push([splitPoint, end]);
      total = maxTotalSeconds;
    }
  }
  return { included, leftover };
}

/**
 * Ngưỡng "khoảng ngắn" cho đường truyền: khoảng thô ngắn hơn 1 giây bị BỎ
 * TRƯỚC khi làm tròn số nguyên (contract §1 — đơn vị gửi lên là giây nguyên,
 * một khoảng không phủ trọn một giây thì không có gì để khai).
 */
export const MIN_WIRE_RANGE_SECONDS = 1;

/**
 * Chuyển một khoảng về giây NGUYÊN cho đường truyền (contract §1) — V-J.
 *
 * Quy tắc, ĐÚNG THEO THỨ TỰ NÀY: BỎ khoảng thô ngắn hơn `MIN_WIRE_RANGE_SECONDS`
 * → `floor` CẢ HAI ĐẦU → bỏ lần nữa nếu kết quả co xuống dưới ngưỡng.
 *
 * V-J (gate #17 vòng 4, BLOCKER đo được): `floor` CẢ HAI ĐẦU không trung tính
 * như comment cũ trong `buildHeartbeatPayload` khẳng định. Đo trên khoảng thô
 * 0.25s (đúng mức `boundedOpenCredit` cắt cho một cú tua):
 *
 * | frac(media) | thô  | floor/floor KHÔNG lọc |
 * |-------------|------|-----------------------|
 * | 0.00–0.50   | 0.25 | 0s (rỗng)             |
 * | 0.75–0.95   | 0.25 | **1s (4x)**           |
 *
 * `floor(10.80)=10` và `floor(11.05)=11` lệch nhau 1, nên 0.25s phình thành
 * trọn 1 giây ở ~25% vị trí dừng. Đo trên kịch bản spam tua +5s/tick 200ms
 * (mảng thô 10.3s): pha 0.80 và 0.95 cho **50 giây** trên dây, pha 0.50 cho
 * 1 giây — mở lại đúng lỗ 4x mà V-F tồn tại để chặn.
 *
 * KHÓA CỦA LỜI GIẢI nằm ở chỗ LỌC TRƯỚC, không phải ở chỗ đổi hàm làm tròn.
 * Một khoảng ngắn do tua sinh ra luôn ngắn hơn 1 giây (sàn tín dụng mỗi mẫu
 * không liên tục là `MIN_RANGE_SECONDS` = 0.5s, xem `boundedOpenCredit`), nên
 * BỎ nó ngay từ đầu thì không còn gì để `floor` thổi lên nữa. Lọc SAU khi
 * floor là chưa đủ: lúc đó khoảng 0.25s đã thành 1 giây và thoả điều kiện
 * `>= 1`, tức nó đã "nở" xong rồi.
 *
 * Vì sao vẫn dùng `floor`/`floor` (chứ không phải `ceil(start)`/`floor(end)`):
 * `send()` cắt dải đang xem thành từng mảnh theo nhịp heartbeat 10 giây, hai
 * mảnh LIỀN KỀ chia sẻ cùng một giá trị biên (`[a, b.x]` rồi `[b.x, c]`).
 * `floor` đưa CẢ HAI về cùng một số nguyên nên chúng dán liền, không sinh khe.
 * `ceil(start)` đẩy đầu mảnh sau lên `b+1` → một khe đúng 1 giây tại MỖI mốc
 * heartbeat; đo được: xem liên tục 100→500s còn 360/400 (mất 10% thời lượng
 * xem thật) — cái giá đó lớn hơn hẳn vấn đề nó định giải quyết.
 *
 * `mergeRanges` PHẢI chạy trước hàm này (người gọi đảm nhiệm): nhiều mảnh ngắn
 * liền kề phải gộp thành một khoảng dài rồi mới xét ngưỡng, nếu không một dải
 * xem thật bị cắt vụn sẽ bị bỏ oan.
 */
function toWireRanges(
  ranges: readonly PlayedRange[],
  duration: number
): PlayedRange[] {
  return ranges
    .filter(([start, end]) => end - start >= MIN_WIRE_RANGE_SECONDS)
    .map(([start, end]): PlayedRange => [
      clamp(Math.floor(start), 0, duration),
      clamp(Math.floor(end), 0, duration),
    ])
    .filter(([start, end]) => end - start >= MIN_WIRE_RANGE_SECONDS);
}

/** Dựng payload gửi lên; giây làm tròn về số nguyên, khoảng đã gộp trước khi gửi. */
export function buildHeartbeatPayload(
  input: BuildHeartbeatPayloadInput
): HeartbeatPayload {
  const duration = Math.max(0, Math.round(input.durationSeconds));
  const position = clamp(Math.round(input.positionSeconds), 0, duration);

  const merged = mergeRanges(input.ranges);

  // V-J (gate #17 vòng 4): chuyển sang giây nguyên TRƯỚC, chặn trần SAU.
  //
  // Thứ tự cũ (trần TRƯỚC, làm tròn SAU — V-H) khiến trần không bao giờ chạm
  // tới con số THẬT SỰ đi lên dây: nó đo tổng THÔ, còn thứ phình ra lại là
  // tổng SAU làm tròn. Reviewer đo được `wire(có trần) == wire(không trần)`
  // trong MỌI trường hợp — trần chỉ chặn đúng thứ không bao giờ to lên, còn
  // thứ to lên (làm tròn) thì nằm ngoài tầm với của nó. Đặt trần SAU bước
  // chuyển sang giây nguyên thì `maxTotalSeconds` mới là chốt chặn thật: nó
  // đo đúng đại lượng gửi lên server.
  const whole = toWireRanges(merged, duration);

  // `leftover` vẫn theo đúng ngữ nghĩa cũ — hàm này chỉ dùng `included`, người
  // gọi (hook) tự gọi `splitByWallClockCap` để giữ phần vượt trần cho nhịp sau.
  const { included } = splitByWallClockCap(
    whole,
    input.maxTotalSeconds ?? Number.POSITIVE_INFINITY
  );

  // Chuyển lần hai: `splitByWallClockCap` cắt ở `start + remaining` — một điểm
  // cắt LIÊN TỤC (trần tính bằng wall-clock, không phải số nguyên), nên khoảng
  // chạm trần có thể ra đầu cuối lẻ. Với mọi khoảng ĐÃ nguyên thì đây là no-op
  // (`floor(n)=n`); nó chỉ hạ phần lẻ của khoảng bị cắt, và có thể bỏ luôn
  // khoảng đó nếu phần còn lại dưới 1 giây.
  const ranges = toWireRanges(included, duration);

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
