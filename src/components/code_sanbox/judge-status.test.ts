/** L5-6: trạng thái Judge0 hiển thị tiếng Việt, khớp bản dịch "Được chấp nhận"/"Sai đáp án" ở #65. */
import { describe, expect, it } from "vitest";
import { translateJudgeStatus } from "./judge-status";

describe("translateJudgeStatus", () => {
  it.each([
    [3, "Accepted", "Được chấp nhận"],
    [4, "Wrong Answer", "Sai đáp án"],
    [5, "Time Limit Exceeded", "Vượt quá thời gian"],
    [6, "Compilation Error", "Lỗi biên dịch"],
    [7, "Runtime Error (SIGSEGV)", "Lỗi khi chạy"],
    [11, "Runtime Error (NZEC)", "Lỗi khi chạy"],
    [13, "Internal Error", "Lỗi hệ thống"],
  ])("id %i (%s) -> %s", (id, description, vi) => {
    expect(translateJudgeStatus({ id, description })).toBe(vi);
  });

  it("trạng thái lạ giữ nguyên chuỗi gốc", () => {
    expect(translateJudgeStatus({ id: 99, description: "Brand New Status" })).toBe("Brand New Status");
  });

  it("không có trạng thái thì trả chuỗi rỗng", () => {
    expect(translateJudgeStatus(undefined)).toBe("");
  });
});
