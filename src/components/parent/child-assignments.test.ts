import { describe, expect, it } from "vitest";
import type { ChildAssignment } from "@/services/parent-dashboard.service";
import { CHILD_ASSIGNMENT_STATE_LABEL, childAssignmentState, splitAssignmentsByDeadline } from "./child-assignments";

const NOW = new Date("2026-11-04T10:00:00Z").getTime();

const make = (
  id: string,
  due: string | undefined,
  status = "not_started",
  extra: Partial<ChildAssignment> = {},
): ChildAssignment => ({
  id,
  title: id,
  type: "code",
  difficulty: "easy",
  due_date: due,
  status,
  test_cases_passed: 0,
  total_test_cases: 0,
  submission_count: 0,
  ...extra,
});

describe("splitAssignmentsByDeadline (P-02)", () => {
  it("keeps past-due items out of upcoming and lists upcoming soonest first", () => {
    const { upcoming } = splitAssignmentsByDeadline(
      [
        make("old", "2026-10-12T00:00:00Z", "overdue"),
        make("later", "2026-11-20T00:00:00Z"),
        make("soon", "2026-11-05T00:00:00Z"),
      ],
      NOW,
    );
    expect(upcoming.map((a) => a.id)).toEqual(["soon", "later"]);
  });

  it("returns overdue separately, most recently overdue first", () => {
    const { overdue } = splitAssignmentsByDeadline(
      [make("oct12", "2026-10-12T00:00:00Z", "overdue"), make("oct23", "2026-10-23T00:00:00Z", "overdue")],
      NOW,
    );
    expect(overdue.map((a) => a.id)).toEqual(["oct23", "oct12"]);
  });

  it("ignores completed, undated and unparsable items", () => {
    const result = splitAssignmentsByDeadline(
      [make("done", "2026-10-01T00:00:00Z", "completed"), make("nodue", undefined), make("bad", "not-a-date")],
      NOW,
    );
    expect(result).toEqual({ upcoming: [], overdue: [], retry: [] });
  });

  // QA-B-23: bài con đã nộp (đang chờ chấm) từng bị tính quá hạn ở trang chủ + tab Tổng quan.
  it("never counts a submitted assignment as overdue, even past its deadline", () => {
    const submitted = make("mini-project", "2026-10-07T16:59:00Z", "in_progress", {
      submission_count: 1,
      best_verdict: "pending",
    });
    const unsubmitted = make("top5", "2026-10-20T00:00:00Z", "overdue");
    const { overdue, upcoming } = splitAssignmentsByDeadline([submitted, unsubmitted], NOW);
    expect(overdue.map((a) => a.id)).toEqual(["top5"]);
    expect(upcoming).toEqual([]);
  });
});

describe("childAssignmentState (QA-B-23)", () => {
  it("submitted and still pending is awaiting grade, not overdue", () => {
    const a = make("x", "2026-10-07T00:00:00Z", "in_progress", { submission_count: 1, best_verdict: "pending" });
    expect(childAssignmentState(a, NOW)).toBe("awaiting_grade");
  });

  it("submitted but rejected verdict needs retry", () => {
    const a = make("x", "2026-11-20T00:00:00Z", "in_progress", { submission_count: 2, best_verdict: "wrong_answer" });
    expect(childAssignmentState(a, NOW)).toBe("needs_retry");
  });

  it("unsubmitted past deadline is overdue even when the API status is stale", () => {
    expect(childAssignmentState(make("x", "2026-10-07T00:00:00Z", "not_started"), NOW)).toBe("overdue");
  });

  it("unsubmitted with future or no deadline is not started", () => {
    expect(childAssignmentState(make("x", "2026-11-20T00:00:00Z"), NOW)).toBe("not_started");
    expect(childAssignmentState(make("y", undefined), NOW)).toBe("not_started");
  });

  it("accepted is completed", () => {
    expect(childAssignmentState(make("x", "2026-10-01T00:00:00Z", "completed", { submission_count: 1 }), NOW)).toBe(
      "completed",
    );
  });
});

describe("N-04 (QA4 261123): past-due unfinished submissions and judge errors", () => {
  it("lists a past-due failed or judge-error submission under retry, not upcoming or overdue", () => {
    const failed = make("failed", "2026-10-10T00:00:00Z", "in_progress", { submission_count: 2, best_verdict: "wrong_answer" });
    const judge = make("top5", "2026-10-12T00:00:00Z", "in_progress", { submission_count: 3, best_verdict: "system_error" });
    const future = make("future", "2026-11-20T00:00:00Z", "in_progress", { submission_count: 1, best_verdict: "wrong_answer" });
    const { upcoming, overdue, retry } = splitAssignmentsByDeadline([failed, judge, future], NOW);
    expect(retry.map((a) => a.id)).toEqual(["top5", "failed"]);
    expect(overdue).toEqual([]);
    expect(upcoming.map((a) => a.id)).toEqual(["future"]);
  });

  it("a system_error verdict is a judge error, not the child's failure", () => {
    const a = make("x", "2026-10-12T00:00:00Z", "in_progress", { submission_count: 3, best_verdict: "system_error" });
    expect(childAssignmentState(a, NOW)).toBe("judge_error");
    expect(CHILD_ASSIGNMENT_STATE_LABEL.judge_error).toBe("Lỗi chấm, đang xử lý lại");
  });
});
