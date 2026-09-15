/**
 * Test cho bộ gom khoảng "đã phát thật" — trái tim của tính năng chống tua.
 *
 * Ca quan trọng nhất: TUA QUA KHÔNG ĐƯỢC TÍNH. Success criteria của phase nói
 * rõ: tua từ 0:10 tới 9:00 trong video 10 phút phải ra watched_pct ~10%.
 */

import { describe, expect, it } from "vitest";
import {
  appendSample,
  openRange,
  boundedOpenCredit,
  buildHeartbeatPayload,
  isContinuousSample,
  mergeRanges,
  pendingAfterFailure,
  totalWatchedSeconds,
  type PlayedRange,
} from "./played-ranges";

describe("mergeRanges", () => {
  it("gộp hai khoảng chồng nhau", () => {
    expect(mergeRanges([[0, 120], [118, 754]])).toEqual([[0, 754]]);
  });

  it("gộp hai khoảng dính sát nhau (biên bằng nhau)", () => {
    expect(mergeRanges([[0, 10], [10, 20]])).toEqual([[0, 20]]);
  });

  it("giữ nguyên hai khoảng rời", () => {
    expect(mergeRanges([[0, 10], [30, 40]])).toEqual([[0, 10], [30, 40]]);
  });

  it("sắp xếp lại khoảng đưa vào lộn xộn", () => {
    expect(mergeRanges([[30, 40], [0, 10]])).toEqual([[0, 10], [30, 40]]);
  });

  it("bỏ khoảng rỗng, khoảng ngược và giá trị không hữu hạn", () => {
    const dirty = [
      [10, 10],
      [20, 5],
      [Number.NaN, 30],
      [40, Number.POSITIVE_INFINITY],
      [50, 60],
    ] as PlayedRange[];
    expect(mergeRanges(dirty)).toEqual([[50, 60]]);
  });

  it("khoảng bao nhau chỉ còn khoảng lớn", () => {
    expect(mergeRanges([[0, 100], [20, 30]])).toEqual([[0, 100]]);
  });
});

describe("totalWatchedSeconds", () => {
  it("cộng dồn sau khi gộp, không đếm trùng đoạn chồng", () => {
    expect(totalWatchedSeconds([[0, 120], [118, 754]])).toBe(754);
  });

  it("video 10 phút, xem 0:00→0:10 rồi tua tới 9:00 → chỉ tính ~10 giây", () => {
    // Mô phỏng đúng success criteria: 10 giây đầu được ghi, phần tua qua không.
    const ranges: PlayedRange[] = [[0, 10]];
    expect(totalWatchedSeconds(ranges)).toBe(10);
    expect(Math.round((totalWatchedSeconds(ranges) / 600) * 1000) / 10).toBe(1.7);
  });
});

describe("isContinuousSample", () => {
  it("phát bình thường ở 1x → liên tục", () => {
    expect(isContinuousSample(10, 10.25, 1, 250)).toBe(true);
  });

  it("phát ở 2x, video trôi gấp đôi thời gian thực → liên tục", () => {
    expect(isContinuousSample(10, 10.5, 2, 250)).toBe(true);
  });

  it("tua tới 8 giây trong một tick → KHÔNG liên tục", () => {
    expect(isContinuousSample(10, 18, 1, 250)).toBe(false);
  });

  it("tua lùi → KHÔNG liên tục", () => {
    expect(isContinuousSample(100, 20, 1, 250)).toBe(false);
  });

  it("đứng yên (pause) → KHÔNG liên tục", () => {
    expect(isContinuousSample(50, 50, 1, 250)).toBe(false);
  });

  it("buffering dài 5 giây rồi mới có tick → KHÔNG liên tục", () => {
    expect(isContinuousSample(50, 50.25, 1, 5000)).toBe(false);
  });

  it("tick chậm 1 giây vẫn tính là liên tục", () => {
    expect(isContinuousSample(50, 51, 1, 1000)).toBe(true);
  });

  it("playbackRate 0 hoặc âm được coi như 1x (không chia cho 0)", () => {
    expect(isContinuousSample(10, 10.25, 0, 250)).toBe(true);
  });

  // BLOCKER PR #17 (review vòng 1, #3): dung sai TUYỆT ĐỐI cũ (1.5s) cho một
  // cú kéo tua chậm 1.5s/tick 250ms bị chấm "liên tục" — sai vì delta lớn hơn
  // hẳn thời gian thực trôi qua (250ms). Dung sai phải TƯƠNG ĐỐI theo `expected`.
  it("kéo thanh tua chậm 1.5s mỗi tick 250ms → KHÔNG liên tục (dung sai tương đối, không phải hằng số)", () => {
    expect(isContinuousSample(0, 1.5, 1, 250)).toBe(false);
  });

  it("spam phím tua +5s mỗi 200ms → KHÔNG liên tục", () => {
    expect(isContinuousSample(0, 5, 1, 200)).toBe(false);
  });
});

describe("appendSample", () => {
  it("mẫu đầu tiên tạo khoảng mới", () => {
    expect(appendSample([], 5)).toEqual([[5, 5.5]]);
  });

  it("mẫu nối tiếp mở rộng khoảng đang mở", () => {
    expect(appendSample([[0, 10]], 10.5)).toEqual([[0, 10.5]]);
  });

  it("mẫu nằm trong khoảng đang mở không tạo khoảng thứ hai", () => {
    expect(appendSample([[0, 10]], 4)).toEqual([[0, 10]]);
  });

  // Đổi hợp đồng (BLOCKER PR #17, #2): `appendSample` không còn tự phát hiện
  // "nhảy xa" bằng ngưỡng tuyệt đối — quyết định đó giờ thuộc về người gọi
  // (`isContinuousSample`, xem hook `use-video-progress.ts`). Gọi thẳng hàm
  // này với một mẫu xa nghĩa là người gọi ĐÃ xác nhận liên tục, nên nó luôn
  // nối dài. Bản cũ tự ngắt ở đây bằng ngưỡng 0.5s tuyệt đối — đúng con số
  // khiến tick chậm/phát 2x bị cắt vụn (xem review vòng 1).
  it("mẫu nhảy xa VẪN nối dài nếu gọi trực tiếp — 'nhảy xa hay không' giờ do isContinuousSample quyết định, không phải appendSample", () => {
    expect(appendSample([[0, 10]], 500)).toEqual([[0, 500]]);
  });
});

describe("kịch bản đo tốc độ xem thật (BLOCKER PR #17, #2 + #3)", () => {
  /**
   * Mô phỏng N tick `timeupdate` cách đều `tickMs` mili giây thực trong
   * `totalWallMs` — đúng phương pháp reviewer đã đo (gọi thẳng
   * `isContinuousSample` + `appendSample`/`openRange`, không qua React).
   * `advance(mediaTime, tickIndex)` trả về vị trí media MỚI ở mỗi tick;
   * mặc định tiến đúng `playbackRate` (xem thật, không tua).
   */
  function simulate(
    tickMs: number,
    playbackRate: number,
    totalWallMs: number,
    advance: (mediaTime: number) => number = (t) => t + (tickMs / 1000) * playbackRate
  ): { totalWatched: number; continuousCount: number; tickCount: number } {
    const tickCount = Math.round(totalWallMs / tickMs);
    let ranges: PlayedRange[] = [];
    let mediaTime = 0;
    let previous: number | null = null;
    let continuousCount = 0;
    for (let i = 0; i < tickCount; i += 1) {
      mediaTime = advance(mediaTime);
      if (previous !== null && isContinuousSample(previous, mediaTime, playbackRate, tickMs)) {
        ranges = appendSample(ranges, mediaTime);
        continuousCount += 1;
      } else {
        // BLOCKER PR #17 vòng 2b: khoảng mới bị chặn trên bởi thời gian thực
        // đã trôi qua kể từ mẫu trước × playbackRate — khớp đúng cách
        // `handleTimeUpdate` (use-video-progress.ts) tính `elapsedMs`.
        const elapsedMs = previous !== null ? tickMs : null;
        ranges = openRange(ranges, mediaTime, boundedOpenCredit(elapsedMs, playbackRate));
      }
      previous = mediaTime;
    }
    return { totalWatched: totalWatchedSeconds(ranges), continuousCount, tickCount };
  }

  it("phát thật 1x, tick 1000ms (máy chậm) → gần đúng 10s thực, KHÔNG mất một nửa", () => {
    // Trước fix: mỗi tick 1s bị appendSample cắt vụn ở ngưỡng 0.5s tuyệt đối
    // → chỉ ghi ~5s trên 10s thực (đo được trong review vòng 1, hàng C).
    const { totalWatched } = simulate(1000, 1, 10_000);
    expect(totalWatched).toBeGreaterThanOrEqual(9);
  });

  it("phát thật 2x, tick 400ms → gần đúng 20s media trong 10s thực, KHÔNG mất một nửa", () => {
    // Trước fix: cùng lý do trên → chỉ ghi ~10s trên 20s media đã phát thật
    // (đo được trong review vòng 1, hàng D).
    const { totalWatched } = simulate(400, 2, 10_000);
    expect(totalWatched).toBeGreaterThanOrEqual(18);
  });

  it("kéo thanh tua chậm 1.5s mỗi tick 250ms → KHÔNG mẫu nào được chấm liên tục, tổng tín dụng ≤10% so với 10s thực (BLOCKER PR #17 vòng 2b)", () => {
    // Vòng 2a: 0/40 mẫu được chấm liên tục — đúng, nhưng MỖI mẫu bị từ chối
    // vẫn được `openRange` seed CỐ ĐỊNH 0.5s (MIN_RANGE_SECONDS) bất kể có
    // bao nhiêu thời gian thực trôi qua → 40 × 0.5s = 20s tín dụng trên 10s
    // thực (sai số 100%, đo được trong review vòng 2).
    //
    // Vòng 2b: khoảng mới bị chặn trên bởi elapsedMs thực × playbackRate
    // (0.25s ở kịch bản này — nhỏ hơn sàn 0.5s) — chỉ mẫu ĐẦU TIÊN (không có
    // mốc thời gian trước để so) còn seed theo sàn 0.5s, 39 mẫu còn lại chỉ
    // được 0.25s/mẫu. Tổng = 0.5 + 39×0.25 = 10.25s trên 10s thực (sai số
    // 2.5%, đã xác nhận bằng Node script trước khi viết assertion này).
    const { continuousCount, totalWatched } = simulate(250, 1, 10_000, (t) => t + 1.5);
    expect(continuousCount).toBe(0);
    expect(totalWatched).toBeCloseTo(10.25, 5);
    expect(totalWatched).toBeLessThanOrEqual(11); // ≤10% sai số so với 10s thực
  });

  it("spam phím tua +5s mỗi 200ms → KHÔNG mẫu nào được chấm liên tục, tổng tín dụng ≤10% so với 10s thực (BLOCKER PR #17 vòng 2b)", () => {
    // Vòng 2a: 0/50 mẫu liên tục đúng, nhưng 50 × 0.5s = 25s tín dụng trên
    // 10s thực (sai số 150%). Vòng 2b: elapsedMs thực = 200ms → chặn trên
    // 0.2s/mẫu (< sàn 0.5s); chỉ mẫu đầu seed 0.5s. Tổng = 0.5 + 49×0.2 =
    // 10.3s trên 10s thực (sai số 3%, xác nhận bằng Node script).
    const { continuousCount, totalWatched } = simulate(200, 1, 10_000, (t) => t + 5);
    expect(continuousCount).toBe(0);
    expect(totalWatched).toBeCloseTo(10.3, 5);
    expect(totalWatched).toBeLessThanOrEqual(11); // ≤10% sai số so với 10s thực
  });
});

describe("boundedOpenCredit (BLOCKER PR #17 vòng 2b)", () => {
  it("không có mốc thời gian trước (mẫu đầu tiên) → dùng sàn mặc định", () => {
    expect(boundedOpenCredit(null, 1)).toBe(0.5);
  });

  it("elapsedMs không hữu hạn (NaN/Infinity) → coi như không có mốc, dùng sàn", () => {
    expect(boundedOpenCredit(Number.NaN, 1)).toBe(0.5);
    expect(boundedOpenCredit(Number.POSITIVE_INFINITY, 1)).toBe(0.5);
  });

  it("thời gian thực trôi qua ít hơn sàn → chặn trên theo wall-clock, KHÔNG dùng sàn", () => {
    // 200ms thực × 1x = 0.2s — nhỏ hơn sàn 0.5s, phải trả đúng 0.2s.
    expect(boundedOpenCredit(200, 1)).toBe(0.2);
  });

  it("thời gian thực trôi qua nhiều hơn sàn → vẫn chặn ở sàn (không tín dụng vượt sàn)", () => {
    // 5000ms thực × 1x = 5s — lớn hơn sàn 0.5s, kết quả vẫn bị chặn ở 0.5s.
    expect(boundedOpenCredit(5000, 1)).toBe(0.5);
  });

  it("nhân đúng playbackRate vào chặn trên", () => {
    // 200ms thực × 2x = 0.4s.
    expect(boundedOpenCredit(200, 2)).toBeCloseTo(0.4, 10);
  });

  it("playbackRate 0 hoặc âm được coi như 1x", () => {
    expect(boundedOpenCredit(200, 0)).toBe(0.2);
    expect(boundedOpenCredit(200, -1)).toBe(0.2);
  });

  it("elapsedMs âm (không nên xảy ra) được kẹp về 0 → tín dụng bằng sàn giữ vị trí tối thiểu", () => {
    expect(boundedOpenCredit(-100, 1)).toBe(0.001);
  });

  it("elapsedMs xấp xỉ 0 (hai mẫu tới gần như cùng lúc) → vẫn tín dụng sàn giữ vị trí, KHÔNG phải 0", () => {
    // Nếu trả đúng 0, `openRange` tạo khoảng RỖNG bị `mergeRanges` lọc mất —
    // mất luôn vị trí cuối, khiến mẫu liên tục kế tiếp nối dài nhầm khoảng CŨ
    // xuyên suốt đoạn vừa tua qua (xem test hồi quy trong use-video-progress.test.ts).
    expect(boundedOpenCredit(0, 1)).toBe(0.001);
  });

  it("chấp nhận sàn tuỳ chỉnh khác MIN_RANGE_SECONDS", () => {
    expect(boundedOpenCredit(200, 1, 1)).toBe(0.2);
    expect(boundedOpenCredit(5000, 1, 1)).toBe(1);
  });
});

describe("openRange", () => {
  it("luôn đẻ khoảng mới, giữ nguyên khoảng cũ", () => {
    expect(openRange([[0, 10]], 11)).toEqual([
      [0, 10],
      [11, 11.5],
    ]);
  });

  it("mẫu nằm trong khoảng cũ vẫn là khoảng mới — đây là mẫu seek", () => {
    // Seek lùi về giữa đoạn vừa phát: KHÔNG được coi là nối tiếp, nhưng đoạn cũ
    // phải còn nguyên.
    expect(openRange([[0, 10]], 4)).toEqual([[0, 10]]);
  });
});

describe("buildHeartbeatPayload", () => {
  it("đúng shape contract §1, giây là số nguyên", () => {
    const payload = buildHeartbeatPayload({
      lessonId: "lesson-1",
      positionSeconds: 754.4,
      durationSeconds: 1200.2,
      ranges: [[0.2, 120.9], [118.4, 754.1]],
    });

    expect(payload).toEqual({
      lesson_id: "lesson-1",
      position_seconds: 754,
      duration_seconds: 1200,
      // Làm tròn RA NGOÀI (review vòng 1, #19): start floor, end ceil.
      // 0.2→0 (floor), 120.9→121 (ceil); 118.4→118 (floor), 754.1→755 (ceil);
      // 118<=121 nên gộp thành [0,755].
      played_ranges: [[0, 755]],
    });
  });

  it("hợp nhất khoảng ở client TRƯỚC khi gửi", () => {
    const payload = buildHeartbeatPayload({
      positionSeconds: 30,
      durationSeconds: 600,
      ranges: [[0, 10], [10, 20], [30, 40]],
    });
    expect(payload.played_ranges).toEqual([[0, 20], [30, 40]]);
    expect(payload).not.toHaveProperty("lesson_id");
  });

  it("kẹp vị trí và khoảng vào [0, duration]", () => {
    const payload = buildHeartbeatPayload({
      positionSeconds: 9999,
      durationSeconds: 600,
      ranges: [[0, 9999]],
    });
    expect(payload.position_seconds).toBe(600);
    expect(payload.played_ranges).toEqual([[0, 600]]);
  });

  // Review vòng 1 (#19): làm tròn RA NGOÀI (floor start, ceil end) — nhất
  // quán, không tuỳ vị trí lẻ. Trước đây `Math.round` cả hai đầu có thể làm
  // một khoảng ngắn co về `[end, end]` rồi bị lọc mất (mất tiến độ thật);
  // với floor/ceil, `floor(start) < ceil(end)` LUÔN đúng khi `start < end`,
  // nên một khoảng hợp lệ không bao giờ biến mất chỉ vì làm tròn.
  it("khoảng ngắn dưới 1 giây làm tròn ra ngoài, không bị mất", () => {
    const payload = buildHeartbeatPayload({
      positionSeconds: 1,
      durationSeconds: 600,
      ranges: [[10.1, 10.4]],
    });
    expect(payload.played_ranges).toEqual([[10, 11]]);
  });
});

describe("pendingAfterFailure", () => {
  it("giữ khoảng chưa gửi được để gửi kèm lần sau", () => {
    expect(pendingAfterFailure([[30, 40]], [[0, 10]])).toEqual([[0, 10], [30, 40]]);
  });

  it("gộp khoảng dính nhau giữa hai lần lỗi", () => {
    expect(pendingAfterFailure([[0, 10]], [[10, 20]])).toEqual([[0, 20]]);
  });
});
