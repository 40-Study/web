/**
 * Test hook heartbeat chống tua (contract §1).
 *
 * Trọng tâm là HAI trường hợp mutation — thứ mà test hàm thuần không chạm tới:
 *  1. Tua qua một đoạn dài: đoạn bị tua KHÔNG được tính vào `played_ranges`.
 *  2. Mất mạng khi gửi: khoảng đã gom phải được giữ lại và gửi kèm lần sau.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  creditedEndForContinuousSample,
  mergeRanges,
  type PlayedRange,
} from "@/lib/played-ranges";

const updateProgress = vi.fn();

vi.mock("@/services/enrollment.service", () => ({
  enrollmentService: { updateProgress: (...args: unknown[]) => updateProgress(...args) },
}));

vi.mock("sonner", () => ({ toast: { warning: vi.fn(), error: vi.fn(), success: vi.fn() } }));

import { useVideoProgress } from "./use-video-progress";

/** Một lượt gửi mới nhất, đã lấy ra khỏi mock. */
function lastSentRanges(): [number, number][] {
  const calls = updateProgress.mock.calls;
  const payload = calls[calls.length - 1]?.[1] as { played_ranges: [number, number][] };
  return payload.played_ranges;
}

/**
 * GỘP `played_ranges` của TẤT CẢ các lần gửi heartbeat (không chỉ lần cuối).
 *
 * Sửa theo chẩn đoán của lead (gate #17 vòng 3, giả thuyết (b)): mỗi payload
 * heartbeat chỉ chứa khoảng MỚI kể từ lần gửi trước (server tự merge, xem
 * comment `BuildHeartbeatPayloadInput.ranges`) — `setInterval` 10s thật có
 * thể bắn nhiều lần TRONG một kịch bản test dài (vài trăm giây thực mô phỏng
 * qua `vi.advanceTimersByTime`), nên một khoảng đã xem thật có thể đã được
 * gửi (và bị xoá khỏi `rangesRef`) ở một lần heartbeat GIỮA kịch bản, không
 * còn nằm trong lần gửi CUỐI CÙNG. Đọc đúng "có mất tiến độ hay không" nghĩa
 * là kiểm tra HỢP của mọi lần đã gửi, không phải chỉ lần cuối.
 */
function allSentRanges(): PlayedRange[] {
  const all = updateProgress.mock.calls.flatMap((call) => {
    const payload = call[1] as { played_ranges: PlayedRange[] };
    return payload.played_ranges;
  });
  return mergeRanges(all);
}

const PROGRESS_RESPONSE = {
  lesson_id: "l1",
  status: "in_progress",
  watched_seconds: 30,
  watched_pct: 5,
  last_position_seconds: 30,
  completed_at: null,
  next_lesson_unlocked: false,
} as const;

describe("useVideoProgress", () => {
  beforeEach(() => {
    updateProgress.mockReset();
    updateProgress.mockResolvedValue(PROGRESS_RESPONSE);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("gom khoảng phát liên tục rồi gửi theo nhịp 10 giây", async () => {
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    // V-F (re-review vòng 2): tín dụng nhánh liên tục giờ bị chặn trên theo
    // wall-clock THỰC (`playbackRate × dtWall × 1.05`) — phải advance fake
    // timer GIỮA các tick để mô phỏng đúng nhịp `timeupdate` 250ms thật, nếu
    // không dtWall ≈ 0 và tín dụng bị cắt gần hết. 8 tick × 0.25s = 2s liên
    // tục 1x — đủ để sau floor/floor (V-H, contract giây nguyên) khoảng vẫn
    // còn ≥1s, không bị bỏ.
    await act(async () => {
      for (let i = 1; i <= 8; i += 1) {
        result.current.handleTimeUpdate(i * 0.25, 1, 600);
        vi.advanceTimersByTime(250);
      }
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(updateProgress).toHaveBeenCalled());
    const [lessonId, payload] = updateProgress.mock.calls[0] as [string, Record<string, unknown>];
    expect(lessonId).toBe("l1");
    // BLOCKER review vòng 1 (#8, Q4): heartbeat chỉ gửi đúng 3 field contract
    // §1 — không có `status`, server tự tính từ `watched_pct`.
    expect(payload).not.toHaveProperty("status");
    expect(payload.duration_seconds).toBe(600);
    expect(payload.played_ranges).toEqual([[0, 2]]);
  });

  // Mutation case 1 — tua KHÔNG được tính là đã học.
  it("tua qua một đoạn dài: đoạn bị tua không nằm trong played_ranges", async () => {
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    await act(async () => {
      // 10 mẫu liên tục trong 2,5 giây đầu (tick 250ms THỰC — V-F: tín dụng
      // giờ bị chặn trên theo wall-clock nên phải advance fake timer giữa
      // các tick để mô phỏng đúng nhịp timeupdate thật).
      for (let i = 1; i <= 10; i += 1) {
        result.current.handleTimeUpdate(i * 0.25, 1, 600);
        vi.advanceTimersByTime(250);
      }
      // Tua thẳng tới giây 540 — 537,5 giây nhảy qua.
      result.current.handleTimeUpdate(540, 1, 600);
      vi.advanceTimersByTime(250);
      // 6 tick liên tục sau khi tua (1,5s) — đủ dài để khoảng này còn sống
      // sót qua floor/floor (V-H, contract giây nguyên bỏ khoảng < 1s); chỉ
      // một tick duy nhất (0,25s) sẽ bị floor/floor xoá mất hoàn toàn.
      for (let i = 1; i <= 6; i += 1) {
        result.current.handleTimeUpdate(540 + i * 0.25, 1, 600);
        vi.advanceTimersByTime(250);
      }
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(updateProgress).toHaveBeenCalled());
    const ranges = lastSentRanges();
    // Khoảng đầu chỉ tới ~2s; khoảng thứ hai bắt đầu từ 540s.
    expect(ranges[0][0]).toBe(0);
    expect(ranges[0][1]).toBeLessThan(5);
    // Đoạn ~2s → 540s KHÔNG có trong bất kỳ khoảng nào.
    for (const [start, end] of ranges) {
      expect(start > 5 && end < 540).toBe(false);
    }
    expect(ranges[ranges.length - 1][0]).toBeGreaterThanOrEqual(539);
  });

  // V-G (re-review vòng 2, HỒI QUY): tua LÙI về một vị trí SỚM HƠN, rồi phát
  // tiếp liên tục — trước fix, `appendSample` chọn khoảng để nối bằng
  // `ranges[length-1]` (start LỚN NHẤT sau khi mergeRanges sắp xếp), nên nối
  // nhầm vào khoảng CŨ [500,600] thay vì khoảng vừa mở ở vị trí 100. 400 giây
  // xem thật (100→500) bị ghi 0 giây.
  //
  // Nhịp tick ở đây là 250ms — ĐÚNG nhịp `timeupdate` của trình duyệt thật —
  // không phải tick 25s như bản trước. Số ĐO được trên chính kịch bản này
  // (probe tạm, xoá sau khi lấy số; cùng một probe chạy 2 nhịp):
  //   · tick 25s,  code TRƯỚC fix: coverage [100,500] = 200/400 (mất đúng nửa).
  //   · tick 250ms, code TRƯỚC fix: coverage [100,500] = 400/400, NHƯNG tổng
  //     toàn kịch bản chỉ 490/500 — dải 500→600 bị cắt thành từng mảnh ~9s
  //     cách nhau 1s ([[100,509],[510,519],…]) và mất hẳn 1s ở mỗi mốc
  //     heartbeat (đúng lớp bug V-G).
  //   · tick 250ms, code SAU fix:  coverage [100,500] = 400/400, tổng 500/500.
  // => Tick 25s là một mô phỏng KHÔNG có thật: `timeupdate` bắn ~4 lần mỗi
  // giây, nên một mẫu cách mẫu trước 25 giây không bao giờ xảy ra khi video
  // đang phát; chính khoảng cách đó mới là thứ phá vỡ mốc vị trí qua mỗi lần
  // gửi heartbeat (xem test "qua mốc heartbeat" bên dưới). Viết lại ở nhịp
  // thật là ĐÚNG — nhưng viết lại KHÔNG ĐỦ: ở nhịp thật code chưa fix vẫn mất
  // 10 giây thật, nên nếu chỉ giữ ngưỡng 390 cho cửa sổ [100,500] thì test
  // xanh với CẢ code chưa fix (đã đo) — một test không chặn được hồi quy nào.
  // Vì vậy dưới đây khẳng định thêm TỔNG của toàn kịch bản.
  it("tua lùi rồi xem tiếp phải ghi đủ phần vừa xem (không nối nhầm vào khoảng cũ ở xa)", async () => {
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    // `vi.advanceTimersByTimeAsync` (bản async) chứ không phải bản đồng bộ:
    // xả hàng đợi microtask giữa mỗi lần bắn timer, nên promise của
    // `enrollmentService.updateProgress(...)` kịp resolve và `inFlightRef`
    // không bị kẹt `true` suốt kịch bản — heartbeat gửi rải đều đúng nhịp
    // 10 giây như thiết kế (bản đồng bộ khiến chỉ đúng MỘT heartbeat thật sự
    // gửi đi trong cả kịch bản, một mô phỏng sai).
    const tickMs = 250;
    const tickS = tickMs / 1000;

    await act(async () => {
      // Xem liên tục 500 → 600 (100 giây media, 400 tick thực).
      result.current.handleTimeUpdate(500, 1, 600);
      await vi.advanceTimersByTimeAsync(tickMs);
      for (let i = 1; i <= 100 / tickS; i += 1) {
        result.current.handleTimeUpdate(500 + i * tickS, 1, 600);
        await vi.advanceTimersByTimeAsync(tickMs);
      }
      // Tua lùi về giây 100 — mở khoảng mới, KHÔNG đụng khoảng [500,600].
      result.current.handleTimeUpdate(100, 1, 600);
      await vi.advanceTimersByTimeAsync(tickMs);
      // Xem tiếp 100 → 500 (400 giây thật).
      for (let i = 1; i <= 400 / tickS; i += 1) {
        result.current.handleTimeUpdate(100 + i * tickS, 1, 600);
        await vi.advanceTimersByTimeAsync(tickMs);
      }
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    await waitFor(() => expect(updateProgress).toHaveBeenCalled());
    // Gộp TẤT CẢ các lần gửi (không chỉ lần cuối) — kịch bản dài có nhiều
    // heartbeat giữa chừng, mỗi payload chỉ mang khoảng MỚI kể từ lần gửi
    // trước (server tự merge); đoạn 100→500 có thể đã nằm trong một lần gửi
    // GIỮA kịch bản, không phải lần cuối cùng (xem `allSentRanges`).
    const ranges = allSentRanges();
    // Đo TỔNG độ phủ trong cửa sổ [100,500] trên TOÀN BỘ các khoảng đã gộp,
    // thay vì đòi hỏi đúng MỘT khoảng liền mạch: một heartbeat bắn giữa lúc
    // đang xem 100→500 có thể cắt đoạn này thành 2-3 khoảng liền kề nhau (vô
    // hại — vẫn đúng vị trí, chỉ khác lần gửi), không phải bug V-G. Bug V-G
    // (nối nhầm vào [500,600]) khiến độ phủ ở đây gần như BẰNG 0 (chỉ còn
    // marker mở khoảng tại vị trí tua), nên ngưỡng 390/400 vẫn đủ phân biệt.
    const coverageIn100To500 = ranges.reduce((sum, [start, end]) => {
      const overlapStart = Math.max(start, 100);
      const overlapEnd = Math.min(end, 500);
      return sum + Math.max(0, overlapEnd - overlapStart);
    }, 0);
    expect(coverageIn100To500).toBeGreaterThanOrEqual(390);

    // TỔNG độ phủ của TOÀN kịch bản. Hai đoạn đã xem (500→600 rồi lùi về
    // 100→500) hợp lại đúng bằng cửa sổ [100,600] = 500 giây thật, nên tổng
    // độ phủ ở đây là phép đo TRỰC TIẾP "có mất giây nào đã xem không".
    // `ranges` đã gộp nên các khoảng không chồng nhau — cộng theo từng khoảng
    // là chính xác, không đếm trùng.
    //
    // Ngưỡng 495 (mất ≤5s): `buildHeartbeatPayload` floor cả hai đầu về giây
    // nguyên, và làm tròn chỉ ăn khớp ranh giới khi hai mảnh LIỀN KỀ nhau (hai
    // ranh giới phân số cùng floor về một số nguyên thì liền lại, không sinh
    // khe) — nên sai số làm tròn thật đo được là 0, không phải một giây mỗi
    // mảnh. Ngưỡng này tách được đúng hai trạng thái đã đo: 500/500 (sau fix,
    // PASS) so với 490/500 (trước fix, RED) — chặt hơn hẳn ngưỡng 390 của cửa
    // sổ [100,500], vốn xanh với cả hai.
    const coverageIn100To600 = ranges.reduce((sum, [start, end]) => {
      const overlapStart = Math.max(start, 100);
      const overlapEnd = Math.min(end, 600);
      return sum + Math.max(0, overlapEnd - overlapStart);
    }, 0);
    expect(coverageIn100To600).toBeGreaterThanOrEqual(495);
  });

  // V-G tái review (gate #17 vòng 3): BUG THẬT ở mốc qua nhịp heartbeat.
  //
  // `send()` rút phần đã gửi khỏi buffer và gán lại `rangesRef.current =
  // leftover`; khi heartbeat gửi hết sạch, buffer về RỖNG. Mẫu liên tục kế
  // tiếp khi đó không có khoảng nào để nối, nên rơi vào nhánh `openRange` và
  // chỉ giữ marker sàn (0.001s) — mỗi nhịp 10 giây lại mở một khoảng mới, và
  // `buildHeartbeatPayload` floor cả hai đầu rồi lọc bỏ mọi khoảng < 1s. Kết
  // quả: dải đang xem bị cắt thành từng mảnh 10s và phần giữa BỎ HẲN.
  //
  // Test này đỏ khi `withOpenRangeMarker` bị gỡ khỏi `send()` (mutation
  // kiểm chứng) — đo được 10/40 giây media ở lần gửi cuối, và tổng hợp mọi
  // lần gửi chỉ ~265/400.
  it("phát liên tục qua nhiều mốc heartbeat: phần giữa các lần gửi không bị bỏ", async () => {
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    const tickMs = 250;
    const tickS = tickMs / 1000;
    const duration = 600;

    // 40 giây media liên tục — băng qua 3 mốc heartbeat 10 giây.
    await act(async () => {
      result.current.handleTimeUpdate(0, 1, duration);
      await vi.advanceTimersByTimeAsync(tickMs);
      for (let i = 1; i <= 40 / tickS; i += 1) {
        result.current.handleTimeUpdate(i * tickS, 1, duration);
        await vi.advanceTimersByTimeAsync(tickMs);
      }
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    await waitFor(() => expect(updateProgress).toHaveBeenCalled());

    // 5% mất mát là mức làm tròn về giây nguyên của `buildHeartbeatPayload`,
    // không phải mất cả một khoảng 10 giây (bug thật cho ~265/400).
    const merged = allSentRanges();
    const credited = merged
      .map(([start, end]) => Math.min(end, 40) - start)
      .reduce((sum, len) => sum + Math.max(0, len), 0);
    expect(credited).toBeGreaterThanOrEqual(38);
  });

  // V-F (re-review vòng 2, CHẶN) — lớp clamp wall-clock TỪNG MẪU ở nhánh liên
  // tục của `handleTimeUpdate`. Đây là test DUY NHẤT bắt được mutation "bỏ
  // `Math.min` khỏi nhánh đó" (đo được: 256/257 test còn lại vẫn xanh).
  //
  // Vì sao các test khác không bắt được: mọi kịch bản khác đều có tổng media
  // ≤ 1,05 × tổng thời gian thực, nên trần TỔNG của payload (V-H,
  // `splitByWallClockCap`) chưa bao giờ chạm tới và phần tín dụng vượt mức bị
  // clamp cắt nằm dưới bước floor/giây-nguyên của `buildHeartbeatPayload` —
  // mất trong im lặng. Ở đây tổng media là 1,5× thời gian thực thật, nên trần
  // payload rộng hơn khoảng cách giữa đầu-cuối bị clamp và đầu cuối KHÔNG bị
  // clamp: trần không cắt, và phần chênh (2 giây) hơn hẳn một giây nên sống
  // sót qua bước floor.
  //
  // Tín dụng đã xem ở đây: mẫu đầu mở khoảng tại 0 (`openRange`, sàn
  // MIN_RANGE_SECONDS = 0,5s — KHÔNG đi qua clamp), mẫu kế ở 0,25s; sau đó
  // main thread bị chặn 8s và mẫu kế mang `currentTime` = 10,15s (media vượt
  // trước thời gian thực 1,9s — vẫn nằm trong băng dung sai liên tục vì
  // `CONTINUITY_TOLERANCE_RATIO × expected` = 0,25 × 8 = 2s ở nhịp dài này, nên
  // mẫu này THẬT SỰ đi qua nhánh clamp, không rơi vào nhánh `openRange`).
  //   · có clamp    → đầu cuối = 0,25 + 1 × 8 × 1,05 = 8,65 → floor → 8 giây.
  //   · bỏ clamp    → đầu cuối = 10,15         → floor → 10 giây.
  // trần tổng của payload (V-H) tại thời điểm gửi là 9,95 × 1,05 = 10,45s —
  // RỘNG HƠN cả hai mức trên, nên phép đo dưới đây chỉ còn phụ thuộc MỘT mình
  // clamp. Đã kiểm chứng bằng mutation thật: gỡ `Math.min` khỏi lời gọi trong
  // hook → 256/257 test của toàn repo vẫn XANH, chỉ đúng test này đỏ với
  // `AssertionError: expected 10 to be less than or equal to 9`.
  //
  // Kịch bản hợp lệ (không phải giả lập sai): `timeupdate` KHÔNG có hợp đồng
  // "bắn đúng 250ms/lần" — nhịp của nó phụ thuộc tải main thread, và trong
  // lúc main thread bị chặn thì ĐỒNG HỒ MEDIA vẫn chạy (video phần cứng/
  // media pipeline không dừng theo JS); mẫu kế tiếp khi đó mang `currentTime`
  // nhảy vượt THỜI GIAN THỰC đã trôi qua. Clamp + `isContinuousSample` cùng
  // tồn tại vì tầng phân loại chỉ xác nhận mẫu "đủ gần" để coi là đang phát;
  // nó KHÔNG phải bằng chứng rằng lượng media đó đã được xem thật.
  it("main thread bị chặn: mẫu dài nối vào khoảng đang mở không được tín dụng quá wall-clock (V-F)", async () => {
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    await act(async () => {
      // Mẫu đầu mở khoảng [0, 0.5] (sàn, không qua clamp).
      result.current.handleTimeUpdate(0, 1, 600);
      await vi.advanceTimersByTimeAsync(250);
      result.current.handleTimeUpdate(0.25, 1, 600);
      // Chặn main thread 8 giây (không mẫu nào bắn), media vẫn trôi 9,9s.
      await vi.advanceTimersByTimeAsync(8_000);
      result.current.handleTimeUpdate(10.15, 1, 600);
      // Chờ thêm trước khi gửi: tổng thời gian thực tích luỹ 9,95s (< 10s nên
      // nhịp heartbeat 10 giây chưa bắn — phép đo diễn ra trên đúng một lần
      // gửi qua `flushNow`), trần payload khi đó 10,45s > 10,15s.
      await vi.advanceTimersByTimeAsync(1_450);
      result.current.flushNow();
      await vi.advanceTimersByTimeAsync(1);
    });

    await waitFor(() => expect(updateProgress).toHaveBeenCalled());
    const ranges = allSentRanges();
    const credited = ranges.reduce((sum, [start, end]) => sum + (end - start), 0);
    expect(credited).toBeLessThanOrEqual(9);
    expect(credited).toBeGreaterThanOrEqual(7);
    expect(ranges[ranges.length - 1][1]).toBeLessThanOrEqual(9);
  });

  // MUTATION GUARD cho chính test V-F ở trên — test này KHÔNG kiểm tra hành vi
  // sản phẩm, nó kiểm tra rằng test kia còn khả năng bắt được mutation.
  //
  // Đo được (mutation thật, rồi khôi phục): thay lời gọi trong hook bằng
  // `currentTime`, hoặc biến chính hàm thành no-op (`return currentTime`), đều
  // khiến 256/257 test của repo vẫn XANH — trừ test hành vi V-F ngay trên và
  // guard này. Guard dưới đây chạy lại đúng phép tính của hàm trên BẢN SAO
  // nguồn đọc từ đĩa và khẳng định nó CÒN kẹp — nếu ai đó biến clamp thành
  // no-op tại chỗ hoặc gỡ hẳn nó, guard đỏ và chỉ thẳng ra rằng lớp bảo vệ mà
  // nó canh đã biến mất, thay vì để test hành vi ở trên lặng lẽ thành
  // decoration.
  it("[guard] `creditedEndForContinuousSample` vẫn còn kẹp — test V-F ở trên không được phép thành decoration", async () => {
    const source = readFileSync(
      path.join(process.cwd(), "src", "lib", "played-ranges.ts"),
      "utf8"
    );
    const start = source.indexOf("export function creditedEndForContinuousSample(");
    expect(start).toBeGreaterThanOrEqual(0);
    const body = source.slice(start, source.indexOf("\n}", start));
    // Từ khoá `Math.min` phải còn, và KHÔNG được nằm sau một dấu `//` (comment).
    expect(body).toContain("Math.min(");
    expect(body).not.toMatch(/\/\/[^\n]*Math\.min\(/);

    // Và hàm (đã import ở đầu file) phải THẬT SỰ còn kẹp ở runtime.
    expect(creditedEndForContinuousSample(10, 100, 1, 250)).toBeCloseTo(10.2625, 10);
  });

  // Mutation case 2 — mất mạng không làm mất tiến độ.
  it("gửi thất bại: khoảng được giữ lại và gửi kèm lần heartbeat sau", async () => {
    updateProgress.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    // 8 tick 250ms (2s liên tục) — đủ dài để sống sót qua floor/floor (V-H),
    // nếu không payload rỗng thì `send()` không bao giờ thật sự gọi
    // `updateProgress` (early-return payload rỗng) và test không còn mô
    // phỏng đúng kịch bản "gửi thất bại".
    await act(async () => {
      for (let i = 1; i <= 8; i += 1) {
        result.current.handleTimeUpdate(i * 0.25, 1, 600);
        vi.advanceTimersByTime(250);
      }
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });
    expect(updateProgress).toHaveBeenCalledTimes(1);

    // Mạng trở lại, thêm mẫu mới ở đoạn khác rồi chờ nhịp kế tiếp.
    updateProgress.mockResolvedValue(PROGRESS_RESPONSE);
    await act(async () => {
      for (let i = 1; i <= 8; i += 1) {
        result.current.handleTimeUpdate(120 + i * 0.25, 1, 600);
        vi.advanceTimersByTime(250);
      }
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(updateProgress).toHaveBeenCalledTimes(2));
    const ranges = lastSentRanges();
    // Khoảng của lần gửi hỏng vẫn còn, gộp chung với khoảng mới.
    expect(ranges.some(([start]) => start <= 1)).toBe(true);
    expect(ranges.some(([start]) => start >= 119)).toBe(true);
  });

  // Review vòng 1 (#11): `notifyProgressOffline` từng được export nhưng
  // không nơi nào gọi — mất mạng, người học không nhận được cảnh báo nào.
  it("gửi thất bại: báo người học qua toast (đã nối notifyProgressOffline)", async () => {
    const { toast } = await import("sonner");
    // Test khác trong file này cũng có thể đã gọi toast (mock dùng chung cấp
    // module) — xoá đếm cũ để chỉ xét lần gọi của chính test này.
    vi.mocked(toast.warning).mockClear();
    updateProgress.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    // Cần ≥1s tín dụng liên tục để payload không rỗng sau floor/floor (V-H)
    // — payload rỗng khiến `send()` return sớm TRƯỚC khi gọi REST, nên
    // `updateProgress` (và do đó nhánh catch/toast) không bao giờ chạy.
    await act(async () => {
      for (let i = 1; i <= 8; i += 1) {
        result.current.handleTimeUpdate(i * 0.25, 1, 600);
        vi.advanceTimersByTime(250);
      }
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  it("đọc watched_pct / status từ response của server, không tự đặt completed", async () => {
    const onProgressChange = vi.fn();
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0, onProgressChange })
    );

    // Cần ≥1s tín dụng liên tục để payload không rỗng sau floor/floor (V-H).
    await act(async () => {
      for (let i = 1; i <= 8; i += 1) {
        result.current.handleTimeUpdate(i * 0.25, 1, 600);
        vi.advanceTimersByTime(250);
      }
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.progress).toEqual(PROGRESS_RESPONSE));
    expect(onProgressChange).toHaveBeenCalledWith(PROGRESS_RESPONSE);
    expect(result.current.progress?.status).toBe("in_progress");

    const [, payload] = updateProgress.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("completed");
  });

  it("flushNow gửi ngay, không đợi hết nhịp 10 giây", async () => {
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    // Cần ≥1s tín dụng liên tục để payload không rỗng sau floor/floor (V-H).
    await act(async () => {
      for (let i = 1; i <= 8; i += 1) {
        result.current.handleTimeUpdate(i * 0.25, 1, 600);
        vi.advanceTimersByTime(250);
      }
    });

    await act(async () => {
      result.current.flushNow();
      await Promise.resolve();
    });

    expect(updateProgress).toHaveBeenCalledTimes(1);
  });

  it("chưa biết duration thì không gửi request rỗng", async () => {
    renderHook(() => useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 }));

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    expect(updateProgress).not.toHaveBeenCalled();
  });

  it("đổi bài thì bộ gom được reset cho bài mới — khoảng bài cũ không lẫn vào bài mới", async () => {
    const { result, rerender } = renderHook(
      ({ lessonId }: { lessonId: string }) => useVideoProgress({ lessonId }),
      { initialProps: { lessonId: "l1" } }
    );

    act(() => {
      result.current.handleTimeUpdate(0.25, 1, 600);
      result.current.handleTimeUpdate(0.5, 1, 600);
    });

    rerender({ lessonId: "l2" });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    // BLOCKER review vòng 1 (#10): đổi bài giờ FLUSH khoảng còn lại của bài
    // CŨ ngay lúc đổi, thay vì âm thầm bỏ (mất tối đa 10s tiến độ thật mỗi
    // lần chuyển bài). Lần gửi này phải là của "l1", không phải "l2".
    expect(updateProgress).toHaveBeenCalledTimes(1);
    const [flushedLessonId] = updateProgress.mock.calls[0] as [string, unknown];
    expect(flushedLessonId).toBe("l1");

    // Sau khi flush, bộ gom của "l2" phải sạch — không tự gửi gì thêm chỉ vì
    // đổi bài, cho tới khi có mẫu `timeupdate` mới của bài "l2".
    updateProgress.mockClear();
    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });
    expect(updateProgress).not.toHaveBeenCalled();
  });
});
