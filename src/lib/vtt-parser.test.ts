/**
 * Test parser WebVTT — panel transcript (contract §4).
 */

import { describe, expect, it } from "vitest";
import {
  findActiveCue,
  formatCueTime,
  hasSubtitleSource,
  parseVtt,
  parseVttTimestamp,
  stripVttMarkup,
} from "./vtt-parser";

const SAMPLE = `WEBVTT

NOTE đây là ghi chú của người tạo phụ đề, không phải cue

1
00:00:01.000 --> 00:00:04.500
Xin chào, hôm nay chúng ta học về biến.

2
00:00:04.500 --> 00:00:09.000 align:middle line:90%
Biến là <c.yellow>một ô nhớ</c> có tên.

cue-khong-so
00:01:02.250 --> 00:01:05.000
Dòng thứ ba
nối tiếp dòng thứ tư.
`;

describe("parseVttTimestamp", () => {
  it("đọc mốc đủ giờ:phút:giây.mili", () => {
    expect(parseVttTimestamp("00:01:02.500")).toBeCloseTo(62.5, 3);
  });

  it("đọc mốc thiếu phần giờ", () => {
    expect(parseVttTimestamp("01:02.500")).toBeCloseTo(62.5, 3);
  });

  it("bỏ phần cài đặt cue phía sau mốc", () => {
    expect(parseVttTimestamp("00:00:04.500 align:middle line:90%")).toBeCloseTo(4.5, 3);
  });

  it("chuỗi rác → NaN", () => {
    expect(Number.isNaN(parseVttTimestamp("không phải thời gian"))).toBe(true);
  });
});

describe("stripVttMarkup", () => {
  it("gỡ thẻ định dạng nhưng giữ chữ", () => {
    expect(stripVttMarkup("<c.yellow>một ô nhớ</c>")).toBe("một ô nhớ");
  });

  it("gỡ thẻ thoại <v Nam>", () => {
    expect(stripVttMarkup("<v Nam>Xin chào</v>")).toBe("Xin chào");
  });

  it("gỡ khối định vị kiểu ASS", () => {
    expect(stripVttMarkup("{\\an8}Dòng trên")).toBe("Dòng trên");
  });

  it("giải mã thực thể HTML", () => {
    expect(stripVttMarkup("a &amp; b &lt;c&gt;")).toBe("a & b <c>");
  });
});

describe("parseVtt", () => {
  it("parse đủ cue, bỏ NOTE và mốc cài đặt", () => {
    const cues = parseVtt(SAMPLE);
    expect(cues).toHaveLength(3);
    expect(cues[0]).toMatchObject({ start: 1, end: 4.5 });
    expect(cues[1].text).toBe("Biến là một ô nhớ có tên.");
  });

  it("dùng dòng id cue làm id khi có", () => {
    const cues = parseVtt(SAMPLE);
    expect(cues[1].id).toBe("2");
    expect(cues[2].id).toBe("cue-khong-so");
  });

  it("nối nhiều dòng chữ của một cue thành một câu", () => {
    const cues = parseVtt(SAMPLE);
    expect(cues[2].text).toBe("Dòng thứ ba nối tiếp dòng thứ tư.");
  });

  it("ném lỗi khi thiếu dòng WEBVTT (không im lặng trả rỗng)", () => {
    expect(() => parseVtt("00:00:01.000 --> 00:00:02.000\nXin chào\n")).toThrow(/WEBVTT/);
  });

  it("chịu được CRLF và BOM", () => {
    const cues = parseVtt("﻿WEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nXin chào\r\n");
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe("Xin chào");
  });

  it("file chỉ có header → mảng rỗng, không lỗi", () => {
    expect(parseVtt("WEBVTT\n\n")).toEqual([]);
  });
});

describe("findActiveCue", () => {
  const cues = parseVtt(SAMPLE);

  it("trả cue đang phát", () => {
    expect(findActiveCue(cues, 2)?.start).toBe(1);
  });

  it("biên kết thúc thuộc cue sau (nửa mở)", () => {
    expect(findActiveCue(cues, 4.5)?.start).toBe(4.5);
  });

  it("khoảng trống giữa hai cue → undefined", () => {
    expect(findActiveCue(cues, 30)).toBeUndefined();
  });
});

describe("formatCueTime", () => {
  it("dưới một giờ → mm:ss", () => {
    expect(formatCueTime(62.4)).toBe("1:02");
  });

  it("từ một giờ trở lên → h:mm:ss", () => {
    expect(formatCueTime(3725)).toBe("1:02:05");
  });
});

describe("hasSubtitleSource", () => {
  it("null/undefined/rỗng → false (panel transcript ẩn)", () => {
    expect(hasSubtitleSource(null)).toBe(false);
    expect(hasSubtitleSource(undefined)).toBe(false);
    expect(hasSubtitleSource("   ")).toBe(false);
  });

  it("có URL → true", () => {
    expect(hasSubtitleSource("https://cdn/study-media/a.vtt")).toBe(true);
  });
});
