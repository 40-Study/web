/**
 * Parser WebVTT tối giản cho panel transcript (contract §4).
 *
 * Không thêm thư viện: `vtt.js`/`subtitle` kéo theo cả trăm KB cho một định dạng
 * mà ta chỉ cần 3 trường (bắt đầu, kết thúc, chữ). Parser ở đây bỏ qua mọi thứ
 * không phải cue (WEBVTT, NOTE, STYLE, REGION, số thứ tự cue) và gỡ thẻ định
 * dạng nội tuyến để phần bôi đen → ghi chú không dính `<c.yellow>`.
 */

export interface VttCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

/** `00:01:02.500` · `01:02.500` · `02.500` → giây. Trả `NaN` nếu không hợp lệ. */
export function parseVttTimestamp(raw: string): number {
  const trimmed = raw.trim();
  // Bỏ phần cài đặt cue phía sau mốc thời gian (`... align:middle line:90%`).
  const stamp = trimmed.split(/\s+/)[0];
  const parts = stamp.split(":");
  if (parts.length < 2 || parts.length > 3) return NaN;

  const secondsPart = parts[parts.length - 1];
  const [secStr, msStr = "0"] = secondsPart.split(".");
  const seconds = Number(secStr);
  const millis = Number(msStr.padEnd(3, "0").slice(0, 3));
  const minutes = Number(parts[parts.length - 2]);
  const hours = parts.length === 3 ? Number(parts[0]) : 0;

  if (![seconds, millis, minutes, hours].every(Number.isFinite)) return NaN;
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/** Gỡ thẻ định dạng (`<v Nam>`, `<c.yellow>`, `{\an8}`) khỏi chữ của cue. */
export function stripVttMarkup(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\{\\[^}]*\}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Parse một file `.vtt`. Ném `Error` khi thiếu dòng `WEBVTT` — im lặng trả `[]`
 * sẽ biến một file hỏng thành "bài giảng không có phụ đề", không cách nào nhận ra.
 */
export function parseVtt(source: string): VttCue[] {
  const normalized = source.replace(/\r\n?/g, "\n").replace(/^﻿/, "");
  const lines = normalized.split("\n");

  if (!lines.some((line) => line.trim().startsWith("WEBVTT"))) {
    throw new Error("File không phải định dạng WebVTT (thiếu dòng WEBVTT)");
  }

  const cues: VttCue[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (line === "" || isNonCueBlock(line)) {
      index += 1;
      continue;
    }

    // Dòng thời gian có thể đứng ngay, hoặc sau một dòng id cue.
    let timeLine = line;
    let id = `cue-${cues.length + 1}`;
    let bodyStart = index + 1;

    if (!line.includes("-->")) {
      id = line;
      timeLine = (lines[index + 1] ?? "").trim();
      bodyStart = index + 2;
    }

    if (!timeLine.includes("-->")) {
      index += 1;
      continue;
    }

    const [rawStart, rawEnd] = timeLine.split("-->");
    const start = parseVttTimestamp(rawStart);
    const end = parseVttTimestamp(rawEnd);

    const body: string[] = [];
    let cursor = bodyStart;
    while (cursor < lines.length && lines[cursor].trim() !== "") {
      body.push(lines[cursor]);
      cursor += 1;
    }

    const text = stripVttMarkup(body.join("\n").replace(/\n/g, " "));
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && text) {
      cues.push({ id, start, end, text });
    }

    index = cursor;
  }

  return cues;
}

/** NOTE / STYLE / REGION là khối không phải cue — bỏ qua cả khối. */
function isNonCueBlock(line: string): boolean {
  return /^(NOTE|STYLE|REGION)\b/.test(line);
}

/** Cue đang phát tại `currentTime`; `undefined` khi nằm giữa hai cue. */
export function findActiveCue(cues: readonly VttCue[], currentTime: number): VttCue | undefined {
  return cues.find((cue) => currentTime >= cue.start && currentTime < cue.end);
}

/** `mm:ss` cho nhãn thời gian trong panel (quá 1 giờ thì thêm `h`). */
export function formatCueTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return h > 0
    ? `${h}:${mm}:${String(s).padStart(2, "0")}`
    : `${mm}:${String(s).padStart(2, "0")}`;
}

/** Nguồn phụ đề có thật hay không — `null`/rỗng ⇒ panel transcript ẩn (contract §4). */
export function hasSubtitleSource(url: string | null | undefined): boolean {
  return typeof url === "string" && url.trim().length > 0;
}
