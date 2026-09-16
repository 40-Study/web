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
  creditedEndForContinuousSample,
  isContinuousSample,
  mergeRanges,
  pendingAfterFailure,
  totalWatchedSeconds,
  WALL_CLOCK_CREDIT_SLACK,
  type PlayedRange,
} from "./played-ranges";

/**
 * Mô phỏng N tick `timeupdate` cách đều `tickMs` mili giây thực trong
 * `totalWallMs` — đúng phương pháp reviewer đã đo (gọi thẳng
 * `isContinuousSample` + `appendSample`/`openRange`, không qua React).
 * `advance(mediaTime)` trả về vị trí media MỚI ở mỗi tick; mặc định tiến
 * đúng `playbackRate` (xem thật, không tua).
 *
 * V-F: nhánh liên tục cũng tự áp trần wall-clock mỗi mẫu — khớp đúng cách
 * `handleTimeUpdate` (use-video-progress.ts) tính `creditedEnd`, để hàm này
 * dùng chung được cho cả kịch bản xem thật lẫn kịch bản dùng để đo tầng
 * payload (V-H) ở describe bên dưới.
 *
 * V-J: `startMedia` (mặc định 0) dịch điểm bắt đầu sang một PHA khác trong
 * giây. Đây là tham số quyết định khả năng phát hiện hồi quy của các test
 * spam bên dưới: ở `startMedia = 0` mọi vị trí đều rơi đúng số nguyên nên
 * phép làm tròn nào cũng cho cùng kết quả (đo được: floor/floor, floor/ceil
 * và ceil/floor đều ra 0 giây trên dây) — test xanh với cả code hỏng.
 */
function simulate(
  tickMs: number,
  playbackRate: number,
  totalWallMs: number,
  advance: (mediaTime: number) => number = (t) => t + (tickMs / 1000) * playbackRate,
  startMedia = 0
): { ranges: PlayedRange[]; continuousCount: number; tickCount: number; finalMediaTime: number } {
  const tickCount = Math.round(totalWallMs / tickMs);
  let ranges: PlayedRange[] = [];
  let mediaTime = startMedia;
  let previous: number | null = null;
  let continuousCount = 0;
  for (let i = 0; i < tickCount; i += 1) {
    mediaTime = advance(mediaTime);
    if (previous !== null && isContinuousSample(previous, mediaTime, playbackRate, tickMs)) {
      // Dùng CHUNG hàm với hook — không chép lại công thức, nếu không một
      // mutation vào `creditedEndForContinuousSample` sẽ không được test này
      // phát hiện (đây chính là lỗ "green nhưng không chứng minh gì" của V-F).
      const creditedEnd = creditedEndForContinuousSample(previous, mediaTime, playbackRate, tickMs);
      ranges = appendSample(ranges, previous, creditedEnd);
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
  return { ranges, continuousCount, tickCount, finalMediaTime: mediaTime };
}

/**
 * V-H (re-review vòng 2, #3c): đo tín dụng qua kết quả THỰC TẾ gửi lên dây
 * (`buildHeartbeatPayload`), không phải mảng thô trong bộ nhớ — một khoảng
 * đúng ở tầng mảng thô vẫn có thể bị làm tròn/nở sai ở tầng payload (đây
 * chính là lỗi V-H: "green nhưng không chứng minh gì" khi test cũ chỉ đo
 * `totalWatchedSeconds(ranges)`).
 */
function totalWatchedViaPayload(
  ranges: readonly PlayedRange[],
  finalMediaTime: number,
  totalWallMs: number,
  playbackRate: number
): number {
  const rate = playbackRate > 0 ? playbackRate : 1;
  const maxTotalSeconds = rate * (totalWallMs / 1000) * (1 + WALL_CLOCK_CREDIT_SLACK);
  const payload = buildHeartbeatPayload({
    positionSeconds: finalMediaTime,
    durationSeconds: Math.max(finalMediaTime, 1_000_000),
    ranges,
    maxTotalSeconds,
  });
  return payload.played_ranges.reduce((sum, [start, end]) => sum + (end - start), 0);
}

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
    expect(appendSample([], 5, 5)).toEqual([[5, 5.5]]);
  });

  it("mẫu nối tiếp mở rộng khoảng đang mở (previousTime kề đầu cuối khoảng)", () => {
    expect(appendSample([[0, 10]], 10, 10.5)).toEqual([[0, 10.5]]);
  });

  it("mẫu nằm trong khoảng đang mở không tạo khoảng thứ hai", () => {
    expect(appendSample([[0, 10]], 3, 4)).toEqual([[0, 10]]);
  });

  // Đổi hợp đồng (BLOCKER PR #17, #2): `appendSample` không còn tự phát hiện
  // "nhảy xa" bằng ngưỡng tuyệt đối — quyết định đó giờ thuộc về người gọi
  // (`isContinuousSample`, xem hook `use-video-progress.ts`). Gọi thẳng hàm
  // này với một mẫu xa nghĩa là người gọi ĐÃ xác nhận liên tục, nên nó luôn
  // nối dài. Bản cũ tự ngắt ở đây bằng ngưỡng 0.5s tuyệt đối — đúng con số
  // khiến tick chậm/phát 2x bị cắt vụn (xem review vòng 1).
  it("mẫu nhảy xa VẪN nối dài nếu gọi trực tiếp — 'nhảy xa hay không' giờ do isContinuousSample quyết định, không phải appendSample", () => {
    expect(appendSample([[0, 10]], 10, 500)).toEqual([[0, 500]]);
  });

  // V-G (re-review vòng 2, HỒI QUY): bản trước chọn khoảng để nối bằng
  // `ranges[ranges.length - 1]` — sau `mergeRanges` luôn là khoảng có `start`
  // LỚN NHẤT, không phải khoảng đang phát. Đây là repro trực tiếp ở tầng hàm
  // thuần, không qua hook: xem 500→600, tua lùi mở khoảng mới ở 100, xem tiếp
  // 100→500 phải nối vào khoảng [100,...], KHÔNG phải [500,600].
  describe("V-G — chọn khoảng theo vị trí, không theo chỉ số cuối mảng", () => {
    it("nối đúng vào khoảng chứa previousTime dù nó không phải phần tử cuối mảng", () => {
      // Mảng có [500,600] (start lớn hơn) đứng SAU [100,100.25] sau khi
      // mergeRanges sắp theo start tăng dần — appendSample phải nối vào
      // [100,100.25] (chứa previousTime=100), không phải [500,600].
      const ranges: PlayedRange[] = [[100, 100.25], [500, 600]];
      expect(appendSample(ranges, 100, 137.5)).toEqual([[100, 137.5], [500, 600]]);
    });

    it("mô phỏng đủ: 500→600, tua lùi mở [100,100.25], xem tiếp 100→500 phải gộp đủ, không đụng [500,600]", () => {
      let ranges: PlayedRange[] = [[500, 600]];
      // Tua lùi về 100 — mở khoảng mới (giả lập việc hook gọi openRange).
      ranges = openRange(ranges, 100, 0.25);
      expect(ranges).toEqual([[100, 100.25], [500, 600]]);

      // Xem tiếp 100 → 500, previousTime luôn là vị trí SAU của mẫu trước.
      let previousTime = 100;
      for (const next of [150, 200, 250, 300, 350, 400, 450, 500]) {
        ranges = appendSample(ranges, previousTime, next);
        previousTime = next;
      }

      // Bug V-G: nếu nối nhầm vào [500,600], kết quả sẽ vẫn còn [100,100.25]
      // riêng biệt và [500,600] không đổi — tổng watched chỉ 100.25s thay vì
      // gộp liền [100,600] (500s).
      expect(ranges).toEqual([[100, 600]]);
      expect(totalWatchedSeconds(ranges)).toBe(500);
    });
  });
});

/**
 * Các PHA khởi điểm (phần lẻ của giây) mà kịch bản spam được quét qua.
 *
 * V-J (gate #17 vòng 4): một pha duy nhất là test không chứng minh gì. Ở pha
 * 0 mọi vị trí rơi đúng số nguyên nên floor/floor, floor/ceil và ceil/floor
 * cho CÙNG kết quả — test xanh với cả code còn lỗ. 0.8 và 0.95 là hai pha
 * từng khiến bản floor/floor nở một khoảng 0.25s thành 1 giây (4x).
 */
const SPAM_PHASES = [0, 0.25, 0.5, 0.8, 0.95] as const;

describe("kịch bản đo tốc độ xem thật (BLOCKER PR #17, #2 + #3) — đo qua buildHeartbeatPayload, không phải mảng thô (V-H, #3c)", () => {
  it("phát thật 1x, tick 1000ms (máy chậm) → gần đúng 10s thực, KHÔNG mất một nửa", () => {
    // Trước fix: mỗi tick 1s bị appendSample cắt vụn ở ngưỡng 0.5s tuyệt đối
    // → chỉ ghi ~5s trên 10s thực (đo được trong review vòng 1, hàng C).
    const { ranges, finalMediaTime } = simulate(1000, 1, 10_000);
    const totalWatched = totalWatchedViaPayload(ranges, finalMediaTime, 10_000, 1);
    expect(totalWatched).toBeGreaterThanOrEqual(9);
  });

  it("phát thật 2x, tick 400ms → gần đúng 20s media trong 10s thực, KHÔNG mất một nửa", () => {
    // Trước fix: cùng lý do trên → chỉ ghi ~10s trên 20s media đã phát thật
    // (đo được trong review vòng 1, hàng D).
    const { ranges, finalMediaTime } = simulate(400, 2, 10_000);
    const totalWatched = totalWatchedViaPayload(ranges, finalMediaTime, 10_000, 2);
    expect(totalWatched).toBeGreaterThanOrEqual(18);
  });

  // V-F (re-review vòng 2 web PR #17, BLOCKER — kịch bản đúng con số reviewer
  // nêu): kéo tua ĐỀU 0.9s mỗi tick 250ms, rate 1x → expected=0.25,
  // |0.9-0.25|=0.65. Sàn dung sai CŨ (0.75s) cho qua thành "liên tục" → nhánh
  // appendSample nối đủ 0.9s/tick × 40 tick = 36s tín dụng trên 10s thực (số
  // gian lận ~3.6x). Sàn MỚI (0.25s, xem CONTINUITY_TOLERANCE_FLOOR_SECONDS)
  // từ chối đúng mẫu này ngay ở tầng phân loại — nó rơi vào nhánh KHÔNG liên
  // tục (`boundedOpenCredit`), vốn đã tự chặn trên theo wall-clock. Đo qua
  // payload thực tế (không phải mảng thô) để cùng lúc bắt được cả hai lớp
  // phòng thủ: nếu ai đó nới lại sàn dung sai HOẶC bỏ trần tổng payload
  // (V-H), test này phải đỏ.
  //
  // V-J: quét nhiều PHA (xem `SPAM_PHASES`) — xem giải thích ở test spam bên
  // dưới về vì sao một pha duy nhất là test không chứng minh gì.
  it("kéo thanh tua ĐỀU 0.9s mỗi tick 250ms → tổng tín dụng trên payload thực tế ≤ 10.5s so với 10s thực, mọi pha (V-F/V-J)", () => {
    for (const phase of SPAM_PHASES) {
      const { ranges, continuousCount, finalMediaTime } = simulate(
        250, 1, 10_000, (t) => t + 0.9, phase
      );
      // Xác nhận lớp phòng thủ thứ nhất: sàn dung sai mới từ chối đúng mẫu này.
      expect(continuousCount).toBe(0);
      const totalWatched = totalWatchedViaPayload(ranges, finalMediaTime, 10_000, 1);
      expect(totalWatched).toBeLessThanOrEqual(10.5);
    }
  });

  it("kéo thanh tua chậm 1.5s mỗi tick 250ms → KHÔNG mẫu nào được chấm liên tục, tổng tín dụng trên payload thực tế ≤10.5s so với 10s thực, mọi pha (BLOCKER PR #17 vòng 2b + V-H + V-J)", () => {
    // Vòng 2a: 0/40 mẫu được chấm liên tục — đúng, nhưng MỖI mẫu bị từ chối
    // vẫn được `openRange` seed CỐ ĐỊNH 0.5s (MIN_RANGE_SECONDS) bất kể có
    // bao nhiêu thời gian thực trôi qua → 40 × 0.5s = 20s tín dụng trên 10s
    // thực (sai số 100%, đo được trong review vòng 2).
    //
    // Vòng 2b: khoảng mới bị chặn trên bởi elapsedMs thực × playbackRate
    // (0.25s ở kịch bản này — nhỏ hơn sàn 0.5s) — mảng thô cộng dồn còn
    // 10.25s (0.5 + 39×0.25). Nhưng V-H đo ở TẦNG PAYLOAD: mỗi khoảng dài
    // 0.25–0.5s, cách xa nhau (bước nhảy media 1.5s/tick) nên không gộp được
    // với nhau — làm tròn vào trong khiến HẦU HẾT các khoảng ngắn này co về
    // rỗng và bị lọc bỏ. Vẫn giữ trần ≤10.5s làm chốt an toàn chung.
    for (const phase of SPAM_PHASES) {
      const { continuousCount, ranges, finalMediaTime } = simulate(
        250, 1, 10_000, (t) => t + 1.5, phase
      );
      expect(continuousCount).toBe(0);
      const totalWatched = totalWatchedViaPayload(ranges, finalMediaTime, 10_000, 1);
      expect(totalWatched).toBeLessThanOrEqual(10.5);
    }
  });

  // V-J (gate #17 vòng 4, BLOCKER): kịch bản spam +5s/tick 200ms — quét NHIỀU
  // PHA thay vì chỉ pha 0.
  //
  // Vì sao phải quét pha (đo được, không phải giả định): ở `startMedia = 0`
  // mọi vị trí đều rơi đúng số nguyên nên MỌI quy tắc làm tròn cho cùng kết
  // quả — floor/floor, floor/ceil và ceil/floor đều ra 0 giây trên dây, và
  // ngưỡng `<= 10.5` xanh một cách vô nghĩa. Đo trên bản floor/floor ở các
  // pha khác (cùng kịch bản, cùng mảng thô 10.3s):
  //   pha 0.00 → 0s · pha 0.50 → 1s · pha 0.80 → 50s · pha 0.95 → 50s
  // tức ngưỡng 10.5 chỉ có hiệu lực ở pha ≥ ~0.75 — đúng ~25% không gian vị
  // trí dừng, và đó là pha duy nhất test cũ không chạm tới.
  //
  // Khẳng định trên dây thôi là CHƯA ĐỦ (0 ≤ 10.5 luôn đúng): test còn khẳng
  // định mảng THÔ thật sự tích luỹ tín dụng đáng kể, để phép đo là "10.3s tín
  // dụng trong bộ nhớ đã bị chặn xuống ≤10.5s trên dây" chứ không phải "không
  // có gì để đo".
  it("spam phím tua +5s mỗi 200ms → tổng tín dụng trên payload thực tế ≤10.5s so với 10s thực, MỌI PHA (BLOCKER PR #17 vòng 2b + V-H + V-J)", () => {
    for (const phase of SPAM_PHASES) {
      const { continuousCount, ranges, finalMediaTime } = simulate(
        200, 1, 10_000, (t) => t + 5, phase
      );
      expect(continuousCount).toBe(0);

      // Mảng thô PHẢI tích luỹ tín dụng — nếu không, khẳng định dưới đây là
      // một test xanh không chứng minh gì (đúng lỗi của bản trước ở pha 0).
      const rawTotal = totalWatchedSeconds(ranges);
      expect(rawTotal).toBeGreaterThan(10);

      const totalWatched = totalWatchedViaPayload(ranges, finalMediaTime, 10_000, 1);
      expect(totalWatched).toBeLessThanOrEqual(10.5);
      // Khoảng do spam tua đều dưới 1 giây (tín dụng mỗi mẫu không liên tục bị
      // `boundedOpenCredit` chặn ở 0.5s) nên bị LỌC SẠCH trước khi floor — đo
      // được 0 giây trên dây ở cả 5 pha.
      expect(totalWatched).toBe(0);

      // Đo RIÊNG tầng chuyển-giây-nguyên, KHÔNG qua trần (bỏ `maxTotalSeconds`)
      // — vì trần sau khi chuyển xuống dưới bước đó (V-J) đã trở thành một
      // chốt chặn THẬT, nó che mất lỗi làm tròn: đo được dưới bản floor/floor
      // KHÔNG lọc rằng 50 giây phình ra vẫn bị trần cắt về ≤10.5 nên khẳng
      // định trên vẫn xanh. Phép đo dưới đây cô lập đúng tầng đó và là thứ đỏ
      // khi ai đó bỏ phép lọc-trước (đo được: 50 giây ở pha 0.8 so với 10.3
      // giây thô).
      const uncapped = buildHeartbeatPayload({
        positionSeconds: finalMediaTime,
        durationSeconds: 1_000_000,
        ranges,
      });
      const uncappedTotal = uncapped.played_ranges.reduce((sum, [s, e]) => sum + (e - s), 0);
      expect(uncappedTotal).toBeLessThanOrEqual(rawTotal);
    }
  });
});

describe("creditedEndForContinuousSample — trần wall-clock của MỘT MẪU LIÊN TỤC (V-F)", () => {
  it("tín dụng vượt trần bị CẮT về đúng trần, không cộng trọn `currentTime`", () => {
    // 250ms thực ở 1x → trần = 0.25 × 1.05 = 0.2625. Mẫu nhảy 0.5s vẫn nằm
    // trong băng dung sai liên tục (|0.5-0.25| = 0.25 ≤ max(0.25, 0.0625)),
    // nên nếu KHÔNG có clamp thì 0.5s được ghi trọn — gấp đôi thời gian thực.
    expect(creditedEndForContinuousSample(10, 10.5, 1, 250)).toBeCloseTo(10.2625, 10);
  });

  it("mẫu trong mức thời gian thực cho phép → ghi trọn `currentTime` (clamp không cắt nhầm)", () => {
    expect(creditedEndForContinuousSample(10, 10.25, 1, 250)).toBeCloseTo(10.25, 10);
  });

  it("nhân đúng playbackRate vào trần", () => {
    // 400ms thực ở 2x → trần = 2 × 0.4 × 1.05 = 0.84.
    expect(creditedEndForContinuousSample(10, 20, 2, 400)).toBeCloseTo(10.84, 10);
  });

  it("playbackRate 0 hoặc âm được coi như 1x (không chia cho 0, không nới trần)", () => {
    expect(creditedEndForContinuousSample(10, 100, 0, 250)).toBeCloseTo(10.2625, 10);
    expect(creditedEndForContinuousSample(10, 100, -1, 250)).toBeCloseTo(10.2625, 10);
  });

  it("dtWall = 0 (hai mẫu cùng thời điểm) → trần bằng đúng `previousTime`, không tín dụng gì", () => {
    expect(creditedEndForContinuousSample(10, 10.5, 1, 0)).toBe(10);
  });

  it("slack không phải kẽ hở: đầu cuối ghi được KHÔNG BAO GIỜ vượt trần, dù dtMedia có lớn hơn", () => {
    // Quét toàn bộ băng dung sai liên tục ở tick 250ms/1x (dtMedia ∈ (0.25, 0.5]).
    // Trần = 0.25 × 1.05 = 0.2625 — mọi dtMedia LỚN HƠN trần đều bị cắt về 0.2625,
    // nên không mẫu nào ghi được nhiều hơn 5% so với thời gian thực đã trôi qua.
    for (const dtMedia of [0.26, 0.3, 0.4, 0.45, 0.5]) {
      const credited = creditedEndForContinuousSample(0, dtMedia, 1, 250);
      expect(credited).toBeCloseTo(Math.min(dtMedia, 0.2625), 10);
      expect(credited).toBeLessThanOrEqual(1.05 * (250 / 1000) + 1e-9);
    }
    // Và với dtMedia vượt trần thì bị cắt thật (không cộng trọn).
    expect(creditedEndForContinuousSample(0, 0.5, 1, 250)).toBeLessThan(0.5);
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
      // V-J (gate #17 vòng 4 — xem giải thích đầy đủ trong played-ranges.ts):
      // gộp trước ([0.2,120.9] gộp với [118.4,754.1] vì 118.4<=120.9 →
      // [0.2,754.1]), khoảng dài >= 1s nên qua được ngưỡng, rồi floor(0.2)=0,
      // floor(754.1)=754 → [0,754].
      played_ranges: [[0, 754]],
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

  // V-J (gate #17 vòng 4): quy tắc trên dây là "LỌC khoảng thô ngắn hơn 1 giây
  // TRƯỚC, rồi floor cả hai đầu". Lịch sử ba đời: floor/ceil (vòng 1) nở
  // khoảng ngắn thành 1 giây (lỗi V-H); floor/floor KHÔNG LỌC (vòng 2) vẫn nở
  // đúng 4x ở pha bất lợi vì `floor(10.80)=10` lệch `floor(11.05)=11` — lỗi
  // V-J; ceil/floor (vòng 3) hết nở nhưng mất 10% khi xem liên tục dài (khe
  // 1 giây tại mỗi mốc heartbeat). Bản này là bản duy nhất vừa không nở vừa
  // không mất: lọc trước khi floor là mấu chốt, không phải hàm làm tròn.
  it("khoảng ngắn dưới 1 giây bị BỎ TRƯỚC khi floor (không có gì để nở) — V-J", () => {
    const payload = buildHeartbeatPayload({
      positionSeconds: 1,
      durationSeconds: 600,
      ranges: [[10.1, 10.4]],
    });
    expect(payload.played_ranges).toEqual([]);
  });

  // Test khoá chặt phép LỌC-TRƯỚC: quay lại floor/floor KHÔNG lọc làm test
  // này ĐỎ, vì `floor(10.80)=10` và `floor(11.05)=11` lệch nhau 1 nên khoảng
  // 0.25s nở thành trọn 1 giây (4x). Quét cả 4 pha bất lợi, không chỉ một.
  it("khoảng ngắn 0.25s ở pha bất lợi KHÔNG được nở thành 1 giây (4x) — V-J", () => {
    for (const frac of [0.75, 0.8, 0.9, 0.95]) {
      const start = 10 + frac;
      const payload = buildHeartbeatPayload({
        positionSeconds: start,
        durationSeconds: 600,
        ranges: [[start, start + 0.25]],
      });
      expect(payload.played_ranges).toEqual([]);
    }
  });

  it("khoảng dài >= 1 giây vẫn được giữ và floor cả hai đầu — V-J", () => {
    // [10.1, 11.9] dài 1.8s, qua ngưỡng → floor(10.1)=10, floor(11.9)=11.
    const payload = buildHeartbeatPayload({
      positionSeconds: 12,
      durationSeconds: 600,
      ranges: [[10.1, 11.9]],
    });
    expect(payload.played_ranges).toEqual([[10, 11]]);
  });

  it("khoảng dài floor đúng biên, không đẩy đầu lên — V-J", () => {
    // [10.1, 12.9] dài 2.8s → floor(10.1)=10, floor(12.9)=12 → [10,12].
    const payload = buildHeartbeatPayload({
      positionSeconds: 13,
      durationSeconds: 600,
      ranges: [[10.1, 12.9]],
    });
    expect(payload.played_ranges).toEqual([[10, 12]]);
  });

  // Bất biến trung tâm của V-J — phát biểu CHÍNH XÁC: một khoảng thô NGẮN HƠN
  // 1 giây không bao giờ tới được dây (nó bị lọc trước khi floor, nên không có
  // pha nào biến nó thành 1 giây). Đây là thứ phân biệt bản này với floor/floor
  // KHÔNG lọc, và là bất biến đã đo được ở MỌI pha.
  //
  // KHÔNG khẳng định "tổng trên dây ≤ tổng thô" cho MỌI khoảng: điều đó KHÔNG
  // đúng với floor/floor. Một khoảng vừa trên 1 giây bắt đầu ở pha ~0.99 (ví
  // dụ [10.99, 12.0] dài 1.01s) vẫn nở lên 2 giây vì `floor(10.99)=10` và
  // `floor(12.0)=12`. Mức nở bị chặn trên bởi đúng 1 giây cho mỗi khoảng (vì
  // `floor(e)-floor(s)-(e-s) = frac(s) - frac(e) < 1`), và các khoảng ngắn do
  // tua luôn dưới 1 giây nên không bao giờ chạm tới trường hợp này.
  it("BẤT BIẾN V-J: khoảng thô dưới 1 giây KHÔNG BAO GIỜ lên dây, mọi pha", () => {
    for (const frac of [0, 0.25, 0.5, 0.75, 0.8, 0.9, 0.95, 0.99]) {
      const rawStart = 10 + frac;
      const raw: PlayedRange = [rawStart, rawStart + 0.25];
      const payload = buildHeartbeatPayload({
        positionSeconds: rawStart,
        durationSeconds: 600,
        ranges: [raw],
      });
      const wire = payload.played_ranges.reduce((sum, [s, e]) => sum + (e - s), 0);
      // 0.25s thô ở MỌI pha: bị lọc, không bao giờ thành 1 giây. Bản floor/floor
      // KHÔNG lọc cho 1s (4x) ở các pha 0.75–0.95.
      expect(wire).toBe(0);
    }
  });

  describe("V-H — trần TỔNG played_ranges theo wall-clock (maxTotalSeconds)", () => {
    it("không truyền maxTotalSeconds → không chặn (mặc định Infinity, giữ nguyên hành vi test đơn lẻ)", () => {
      const payload = buildHeartbeatPayload({
        positionSeconds: 20,
        durationSeconds: 6000,
        ranges: [[0, 3], [10, 13]],
      });
      expect(payload.played_ranges).toEqual([[0, 3], [10, 13]]);
    });

    it("cắt phần vượt trần, giữ khoảng SỚM NHẤT trước, cắt ngắn khoảng chạm trần", () => {
      // Tổng thô = 3 + 3 = 6s; trần = 4s → giữ nguyên [0,3] (chưa chạm trần),
      // còn dư 1s cho [10,13] → cắt còn [10,11].
      const payload = buildHeartbeatPayload({
        positionSeconds: 20,
        durationSeconds: 6000,
        ranges: [[0, 3], [10, 13]],
        maxTotalSeconds: 4,
      });
      expect(payload.played_ranges).toEqual([[0, 3], [10, 11]]);
    });

    // Trần là chốt chặn THẬT (V-J): nó đo tổng SAU làm tròn, nên khi mảng đã
    // toàn số nguyên và vượt trần thì trần phải cắt. Test này cố ý dùng khoảng
    // nguyên nên nó KHÔNG phụ thuộc vào quy tắc làm tròn — bỏ trần là đỏ ngay,
    // bất kể ai đó đổi ceil/floor thành gì.
    it("trần cắt ĐÚNG tổng SAU làm tròn, không phải tổng thô — đỏ nếu bỏ trần (V-J)", () => {
      const ranges: PlayedRange[] = [[0, 30], [100, 130], [200, 230]];
      // Không trần: cả 90 giây lên dây.
      expect(
        buildHeartbeatPayload({ positionSeconds: 230, durationSeconds: 600, ranges }).played_ranges
      ).toEqual([[0, 30], [100, 130], [200, 230]]);

      // Trần 40s: giữ trọn [0,30], còn dư 10s cho [100,130] → cắt còn
      // [100,110]; [200,230] vượt hẳn → vào `leftover`, không lên dây.
      const capped = buildHeartbeatPayload({
        positionSeconds: 230,
        durationSeconds: 600,
        ranges,
        maxTotalSeconds: 40,
      });
      expect(capped.played_ranges).toEqual([[0, 30], [100, 110]]);
      const total = capped.played_ranges.reduce((sum, [s, e]) => sum + (e - s), 0);
      expect(total).toBeLessThanOrEqual(40);
    });

    // V-J: bất biến "trần là chặn trên THẬT" phải đúng ở MỌI pha — đây là
    // khẳng định trực tiếp lên thứ tự (làm tròn → chặn trần) mà V-J sửa.
    it("mọi pha: tổng trên dây ≤ trần, kể cả khi mảng thô vượt trần (V-J)", () => {
      const maxTotalSeconds = 5;
      for (const phase of SPAM_PHASES) {
        const ranges: PlayedRange[] = [];
        for (let i = 0; i < 20; i += 1) {
          const start = phase + i * 3;
          ranges.push([start, start + 2.5]);
        }
        const payload = buildHeartbeatPayload({
          positionSeconds: 100,
          durationSeconds: 600,
          ranges,
          maxTotalSeconds,
        });
        const total = payload.played_ranges.reduce((sum, [s, e]) => sum + (e - s), 0);
        expect(total).toBeLessThanOrEqual(maxTotalSeconds);
      }
    });

    it("mô phỏng đúng số đo reviewer nêu: spam tua +5s/tick 200ms không được nở thành ~50s trên payload, MỌI PHA (V-H + V-J)", () => {
      // Trước fix (ceil đầu cuối + KHÔNG có trần tổng): mỗi khoảng ~0.2s bị
      // ceil thành 1s — 49 khoảng thổi phồng thành ~50s trên dây dù mảng thô
      // chỉ 10.3s. Sau V-J, chính phép làm tròn vào trong đã chặn được đường
      // này ở mọi pha (đo được: 0s trên dây ở cả 5 pha) — nhưng khẳng định
      // TỔNG trên dây thôi sẽ là một test xanh không chứng minh gì, nên dưới
      // đây đo thêm mảng thô để chắc chắn có tín dụng thật bị chặn.
      const maxTotalSeconds = 1 * (10_000 / 1000) * (1 + WALL_CLOCK_CREDIT_SLACK);
      for (const phase of SPAM_PHASES) {
        const { ranges, finalMediaTime } = simulate(200, 1, 10_000, (t) => t + 5, phase);
        expect(totalWatchedSeconds(ranges)).toBeGreaterThan(10);
        const payload = buildHeartbeatPayload({
          positionSeconds: finalMediaTime,
          durationSeconds: 1_000_000,
          ranges,
          maxTotalSeconds,
        });
        const payloadTotal = payload.played_ranges.reduce(
          (sum, [start, end]) => sum + (end - start),
          0
        );
        expect(payloadTotal).toBeLessThanOrEqual(10.5);
      }
    });
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
