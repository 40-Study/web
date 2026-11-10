import { describe, expect, it } from "vitest";
import { ApiError, ForbiddenError, NetworkError } from "./errors";
import { countByTitle, isUncertainOutcomeError, reconcileUncertainOutcome } from "./uncertain-mutation";

describe("isUncertainOutcomeError (QA-B-03, QA-C-16)", () => {
  it.each([
    ["NetworkError", new NetworkError()],
    ["502", new ApiError(502, "UNKNOWN", "x")],
    ["504", new ApiError(504, "UNKNOWN", "x")],
    ["408", new ApiError(408, "UNKNOWN", "x")],
  ])("%s -> chưa rõ kết quả", (_label, error) => {
    expect(isUncertainOutcomeError(error)).toBe(true);
  });

  it.each([
    ["500 (server đã trả lời)", new ApiError(500, "UNKNOWN", "x")],
    ["403", new ForbiddenError()],
    ["lỗi lạ", new Error("x")],
  ])("%s -> lỗi dứt khoát", (_label, error) => {
    expect(isUncertainOutcomeError(error)).toBe(false);
  });
});

describe("reconcileUncertainOutcome", () => {
  it("thấy thay đổi trên server -> confirmed", async () => {
    await expect(reconcileUncertainOutcome(async () => true)).resolves.toBe("confirmed");
  });
  it("chưa thấy -> unconfirmed", async () => {
    await expect(reconcileUncertainOutcome(async () => false)).resolves.toBe("unconfirmed");
  });
  it("tải lại cũng lỗi -> unconfirmed, không ném lỗi", async () => {
    await expect(reconcileUncertainOutcome(async () => Promise.reject(new NetworkError()))).resolves.toBe("unconfirmed");
  });
});

describe("countByTitle", () => {
  it("đếm theo tiêu đề sau trim, dữ liệu không phải mảng -> 0", () => {
    expect(countByTitle([{ title: "Bài 1" }, { title: " Bài 1 " }, { title: "Bài 2" }], "Bài 1")).toBe(2);
    expect(countByTitle(undefined, "Bài 1")).toBe(0);
    expect(countByTitle({ items: [] }, "Bài 1")).toBe(0);
  });
});
