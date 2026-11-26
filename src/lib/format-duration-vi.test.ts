import { describe, expect, it } from "vitest";
import { formatDurationVi } from "./format-duration-vi";

describe("formatDurationVi (Q8-T09)", () => {
  it.each([
    [125, "2 phút 5 giây"],
    [300, "5 phút"],
    [45, "45 giây"],
    [0, "0 giây"],
    [59.9, "59 giây"],
    [7200, "120 phút"],
    [-5, "0 giây"],
    [Number.NaN, "0 giây"],
    [undefined, "0 giây"],
  ])("%s giây -> %s", (input, expected) => {
    expect(formatDurationVi(input as number)).toBe(expected);
  });
});
