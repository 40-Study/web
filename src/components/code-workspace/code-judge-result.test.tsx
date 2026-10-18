import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CodeJudgeResult } from "./code-judge-result";
import type { ContestCodeResult } from "@/types/contest";
const result: ContestCodeResult = {
  id: "submission",
  problem_id: "problem",
  language: "python",
  status: "WRONG_ANSWER",
  score: 50,
  max_score: 100,
  passed: 1,
  total: 2,
  execution_time_ms: 12,
  memory_used_kb: 1024,
  created_at: "2026-10-15T12:00:00Z",
  tests: [
    { number: 1, hidden: false, status: "ACCEPTED", output: "5", expected: "5" },
    {
      number: 2,
      hidden: true,
      status: "WRONG_ANSWER",
      output: "secret-output",
      expected: "secret-answer",
      error: "secret-error",
    },
  ],
};
describe("Judge result details", () => {
  it("lets learners inspect a test without revealing hidden answers or errors", async () => {
    render(<CodeJudgeResult result={result} />);
    expect(screen.getByRole("status").textContent).toContain("Sai kết quả");
    expect(screen.getByRole("status").textContent).toContain("50/100 điểm");
    await userEvent.click(screen.getByRole("button", { name: "Test 2" }));
    expect(screen.getByText("Test ẩn. Đầu vào và đáp án được giữ kín.")).toBeTruthy();
    expect(screen.queryByText(/secret-/)).not.toBeTruthy();
    expect(screen.getByRole("button", { name: "Test 2" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
    await userEvent.click(screen.getByRole("button", { name: "Test 1" }));
    expect(screen.getByText("KẾT QUẢ MONG ĐỢI")).toBeTruthy();
  });
  it("labels a trial run separately from a scored submission", () => {
    render(<CodeJudgeResult result={{ ...result, id: undefined }} />);
    expect(screen.getByRole("status").textContent).toContain("Chạy thử, không tính điểm");
    expect(screen.getByRole("status").textContent).not.toContain("50/100 điểm");
  });
});
