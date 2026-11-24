import { describe, expect, it } from "vitest";
import { isDueDateInPast } from "./assignment-due-date";

describe("isDueDateInPast", () => {
  const now = new Date("2026-11-24T12:00:00Z");
  it("không có hạn nộp thì hợp lệ", () => expect(isDueDateInPast("", now)).toBe(false));
  it("hạn đã qua", () => expect(isDueDateInPast("2026-11-20T12:00:00Z", now)).toBe(true));
  it("hạn đúng bằng bây giờ cũng coi là đã qua", () => expect(isDueDateInPast(now.toISOString(), now)).toBe(true));
  it("hạn ở tương lai", () => expect(isDueDateInPast("2026-11-25T12:00:00Z", now)).toBe(false));
});
