/**
 * Q9-PG-10: axe `heading-order` trên /home của phụ huynh và các tab chi tiết con: h3/h4 ngay sau h1 (bỏ qua h2).
 * Mỗi trang chỉ được tụt một cấp mỗi lần: h1 -> h2 -> h3.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChildOverview } from "@/services/parent-dashboard.service";

vi.mock("@/hooks/queries/use-auth", () => ({
  useChildren: () => ({ data: { children: [{ id: "c1", username: "student1", full_name: "Lê Văn C" }] }, isLoading: false }),
}));
vi.mock("@/hooks/queries/use-parent-dashboard", () => ({
  useChildOverview: () => ({ data: undefined, isLoading: false }),
  useChildAssignments: () => ({ data: { assignments: [] }, isLoading: false }),
  useChildAttendance: () => ({ data: { records: [] }, isLoading: false }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/queries/use-conversations", () => ({ useCreateDirectConversation: () => ({ mutate: vi.fn() }) }));

import { ParentHomeOverview } from "./parent-home-overview";
import { ChildOverviewTab } from "./child-overview-tab";
import { ChildCoursesTab } from "./child-courses-tab";

const levels = () => screen.getAllByRole("heading").map((h) => Number(h.tagName.slice(1)));

function expectNoSkippedLevel(found: number[]) {
  expect(found[0]).toBe(1);
  found.slice(1).forEach((level, i) => expect(level - found[i], `h${found[i]} -> h${level}`).toBeLessThanOrEqual(1));
}

describe("thứ tự heading của phụ huynh (Q9-PG-10)", () => {
  it("/home: h1 'Con của tôi' -> h2 tên con -> h3 các widget", () => {
    render(<ParentHomeOverview />);
    const found = levels();
    expect(found).toEqual([1, 2, 3, 3]);
    expectNoSkippedLevel(found);
  });

  it("tab Tổng quan của con: tiêu đề mục là h2 (ngay dưới h1 của trang), không phải h3", () => {
    const overview = { can_view_progress: true, can_view_grades: true, can_view_attendance: true } as ChildOverview;
    render(
      <div>
        <h1>Lê Văn C</h1>
        <ChildOverviewTab overview={overview} courses={[]} attendance={[]} assignments={[]} />
      </div>,
    );
    const found = levels();
    expect(found.length).toBeGreaterThan(1);
    expectNoSkippedLevel(found);
  });

  it("tab Khoá học của con: tên khoá là h2", () => {
    const course = { id: "e1", course_id: "k1", course_name: "Pandas", instructor_name: "GV", progress_percent: 40, enrolled_at: "2026-11-01T00:00:00Z" };
    render(
      <div>
        <h1>Lê Văn C</h1>
        <ChildCoursesTab courses={[course]} isLoading={false} />
      </div>,
    );
    expectNoSkippedLevel(levels());
  });
});
