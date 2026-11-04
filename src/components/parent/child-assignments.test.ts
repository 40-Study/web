import { describe, expect, it } from "vitest";
import type { ChildAssignment } from "@/services/parent-dashboard.service";
import { splitAssignmentsByDeadline } from "./child-assignments";

const NOW = new Date("2026-11-04T10:00:00Z").getTime();

const make = (id: string, due: string | undefined, status = "in_progress"): ChildAssignment => ({
  id,
  title: id,
  type: "code",
  difficulty: "easy",
  due_date: due,
  status,
  test_cases_passed: 0,
  total_test_cases: 0,
  submission_count: 0,
});

describe("splitAssignmentsByDeadline (P-02)", () => {
  it("keeps past-due items out of upcoming and lists upcoming soonest first", () => {
    const { upcoming } = splitAssignmentsByDeadline(
      [
        make("old", "2026-10-12T00:00:00Z"),
        make("later", "2026-11-20T00:00:00Z"),
        make("soon", "2026-11-05T00:00:00Z"),
      ],
      NOW,
    );
    expect(upcoming.map((a) => a.id)).toEqual(["soon", "later"]);
  });

  it("returns overdue separately, most recently overdue first", () => {
    const { overdue } = splitAssignmentsByDeadline(
      [make("oct12", "2026-10-12T00:00:00Z"), make("oct23", "2026-10-23T00:00:00Z")],
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
});
