/**
 * C-6 — thời lượng video bài giảng: đọc ô nhập, dựng lại chuỗi, nhận diện video upload.
 *
 * Điểm quan trọng nhất ở đây là `empty` KHÁC `invalid` KHÁC `{ seconds: 0 }`:
 * backend coi `duration = 0` là "chưa biết" (C-2), nên gửi `0` đi là tái mở đúng
 * khoảng trống mà C-6 sinh ra để bịt. Test này chốt rằng ô trống không bao giờ
 * sinh ra số 0.
 */

import { describe, expect, it } from "vitest";
import {
  formatLessonDuration,
  isUploadedVideoUrl,
  parseLessonDuration,
} from "./lesson-duration";

describe("parseLessonDuration — ô trống", () => {
  it("chuỗi rỗng là `empty`, KHÔNG phải 0 giây", () => {
    expect(parseLessonDuration("")).toEqual({ kind: "empty" });
  });

  it("chỉ khoảng trắng cũng là `empty`", () => {
    expect(parseLessonDuration("   ")).toEqual({ kind: "empty" });
  });

  it("`empty` không bao giờ mang trường `seconds`", () => {
    const result = parseLessonDuration("");
    expect(result).not.toHaveProperty("seconds");
  });
});

describe("parseLessonDuration — dạng phút:giây", () => {
  it("12:30 = 750 giây", () => {
    expect(parseLessonDuration("12:30")).toEqual({ kind: "valid", seconds: 750 });
  });

  it("00:45 = 45 giây", () => {
    expect(parseLessonDuration("00:45")).toEqual({ kind: "valid", seconds: 45 });
  });

  it("90:00 = 5400 giây (phần phút không bị giới hạn 59)", () => {
    expect(parseLessonDuration("90:00")).toEqual({ kind: "valid", seconds: 5400 });
  });

  it("bỏ qua khoảng trắng quanh dấu hai chấm", () => {
    expect(parseLessonDuration(" 12 : 30 ")).toEqual({ kind: "valid", seconds: 750 });
  });
});

describe("parseLessonDuration — dạng giờ:phút:giây", () => {
  it("1:05:00 = 3900 giây", () => {
    expect(parseLessonDuration("1:05:00")).toEqual({ kind: "valid", seconds: 3900 });
  });

  it("1:05:30 = 3930 giây", () => {
    expect(parseLessonDuration("1:05:30")).toEqual({ kind: "valid", seconds: 3930 });
  });

  it("phút ở dạng 3 phần phải < 60", () => {
    expect(parseLessonDuration("1:60:00")).toEqual({ kind: "invalid" });
  });
});

describe("parseLessonDuration — số trần hiểu là phút", () => {
  it("12 = 720 giây", () => {
    expect(parseLessonDuration("12")).toEqual({ kind: "valid", seconds: 720 });
  });

  it("1 = 60 giây", () => {
    expect(parseLessonDuration("1")).toEqual({ kind: "valid", seconds: 60 });
  });
});

describe("parseLessonDuration — giá trị bị từ chối", () => {
  it("0 là `invalid` (không phải `empty`) — gửi 0 vô nghĩa với backend", () => {
    expect(parseLessonDuration("0")).toEqual({ kind: "invalid" });
  });

  it("0:00 là `invalid`", () => {
    expect(parseLessonDuration("0:00")).toEqual({ kind: "invalid" });
  });

  it("giây ≥ 60 bị từ chối", () => {
    expect(parseLessonDuration("12:60")).toEqual({ kind: "invalid" });
    expect(parseLessonDuration("12:99")).toEqual({ kind: "invalid" });
  });

  it("vượt 24 giờ bị từ chối", () => {
    expect(parseLessonDuration("24:00:00")).toEqual({ kind: "valid", seconds: 86400 });
    expect(parseLessonDuration("24:00:01")).toEqual({ kind: "invalid" });
    expect(parseLessonDuration("1441")).toEqual({ kind: "invalid" });
  });

  it("số âm bị từ chối", () => {
    expect(parseLessonDuration("-5")).toEqual({ kind: "invalid" });
  });

  it("chữ và ký tự lạ bị từ chối", () => {
    expect(parseLessonDuration("abc")).toEqual({ kind: "invalid" });
    expect(parseLessonDuration("12:3a")).toEqual({ kind: "invalid" });
    expect(parseLessonDuration("12.5")).toEqual({ kind: "invalid" });
  });

  it("quá ba phần bị từ chối", () => {
    expect(parseLessonDuration("1:2:3:4")).toEqual({ kind: "invalid" });
  });
});

describe("formatLessonDuration — dựng lại chuỗi cho ô nhập", () => {
  it("750 giây → `12:30`", () => {
    expect(formatLessonDuration(750)).toBe("12:30");
  });

  it("45 giây → `0:45` (giữ số 0 đầu, không rút gọn thành `45`)", () => {
    expect(formatLessonDuration(45)).toBe("0:45");
  });

  it("3600 giây → `1:00:00`", () => {
    expect(formatLessonDuration(3600)).toBe("1:00:00");
  });

  it("dưới 1 giờ thì không có phần giờ", () => {
    expect(formatLessonDuration(3599)).toBe("59:59");
  });

  it("giá trị không dùng được → chuỗi rỗng (đi tiếp ra `empty` khi lưu)", () => {
    expect(formatLessonDuration(0)).toBe("");
    expect(formatLessonDuration(-1)).toBe("");
    expect(formatLessonDuration(undefined)).toBe("");
    expect(formatLessonDuration(null)).toBe("");
    expect(formatLessonDuration(Number.NaN)).toBe("");
  });

  it("khứ hồi: chuỗi đã dựng đọc lại ra đúng số giây ban đầu", () => {
    for (const seconds of [45, 750, 3599, 3600, 3930, 86400]) {
      const roundTrip = parseLessonDuration(formatLessonDuration(seconds));
      expect(roundTrip).toEqual({ kind: "valid", seconds });
    }
  });
});

describe("isUploadedVideoUrl — chọn câu gợi ý", () => {
  it("nhận URL HLS do hệ thống upload sinh ra", () => {
    expect(isUploadedVideoUrl("/api/hls/up-123/master.m3u8")).toBe(true);
  });

  it("không nhận URL ngoài hệ thống", () => {
    expect(isUploadedVideoUrl("https://www.youtube.com/watch?v=abc")).toBe(false);
    expect(isUploadedVideoUrl("https://cdn.example.com/v.mp4")).toBe(false);
  });

  it("không nhận khi thiếu URL", () => {
    expect(isUploadedVideoUrl(undefined)).toBe(false);
    expect(isUploadedVideoUrl(null)).toBe(false);
    expect(isUploadedVideoUrl("")).toBe(false);
  });
});
