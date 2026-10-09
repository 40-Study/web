import { describe, expect, it } from "vitest";
import { isUuid } from "./uuid";

describe("isUuid", () => {
  it.each(["3f2a9c1e-7b4d-4e0a-9d51-0c8f6a2b1e34", "3F2A9C1E-7B4D-4E0A-9D51-0C8F6A2B1E34"])("%s -> true", (v) => {
    expect(isUuid(v)).toBe(true);
  });

  it.each([
    "",
    "a1",
    "3f2a9c1e-7b4d",
    "3f2a9c1e7b4d4e0a9d510c8f6a2b1e34", // không có dấu gạch
    "3f2a9c1e-7b4d-4e0a-9d51-0c8f6a2b1e34x",
    " 3f2a9c1e-7b4d-4e0a-9d51-0c8f6a2b1e34",
    "3f2a9c1e-7b4d-4e0a-9d51-0c8f6a2b1e3g",
  ])("%j -> false", (v) => {
    expect(isUuid(v)).toBe(false);
  });
});
