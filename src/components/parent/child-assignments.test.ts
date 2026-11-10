import { describe, expect, it } from "vitest";
import type { ChildAssignment } from "@/services/parent-dashboard.service";
import { childAssignmentState, splitAssignmentsByDeadline } from "./child-assignments";

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
    expect(result).toEqual({ upcoming: [], overdue: [] });
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
