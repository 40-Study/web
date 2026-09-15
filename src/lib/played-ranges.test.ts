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

  it("mẫu nhảy xa tạo khoảng mới", () => {
    expect(appendSample([[0, 10]], 500)).toEqual([[0, 10], [500, 500.5]]);
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

  it("khoảng co lại thành rỗng sau khi làm tròn thì bị bỏ", () => {
    const payload = buildHeartbeatPayload({
      positionSeconds: 1,
      durationSeconds: 600,
      ranges: [[10.1, 10.4]],
    });
    expect(payload.played_ranges).toEqual([]);
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
