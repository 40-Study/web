import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone (P-03)", () => {
  it.each([
    ["0912345678", "+84912345678"],
    ["091 234 5678", "+84912345678"],
    ["0912.345.678", "+84912345678"],
    ["84912345678", "+84912345678"],
    ["0084912345678", "+84912345678"],
    ["+84912345678", "+84912345678"],
    ["+1 415 555 2671", "+14155552671"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["abc123", "123", "0912", "09123456789", "+0912345678", "+84 12", "", "   "])(
    "%j -> null",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );
});
