/**
 * R7: chi tiết lớp của khu tổ chức hiện thêm danh sách bài tập, mỗi bài dẫn tới trang chấm dưới /org/classes/:id.
 */

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ classId: "c1" }),
}));
vi.mock("@/components/classes/class-manage-panel", () => ({
  ClassManagePanel: ({ classId }: { classId: string }) => <div data-testid="manage">{classId}</div>,
}));
vi.mock("@/components/classes/class-assignments-list", () => ({
  ClassAssignmentsList: ({ classId, hrefFor }: { classId: string; hrefFor: (id: string) => string }) => (
    <a data-testid="assignments" href={hrefFor("a7")}>
      {classId}
    </a>
  ),
}));

import OrgClassDetailPage from "./page";
import { renderWithProviders } from "@/test/utils";

describe("OrgClassDetailPage", () => {
  it("ghép panel quản lý lớp và danh sách bài tập cho cùng classId", () => {
    renderWithProviders(<OrgClassDetailPage />);
    expect(screen.getByTestId("manage").textContent).toBe("c1");
    expect(screen.getByTestId("assignments").textContent).toBe("c1");
  });

  it("bài tập dẫn tới /org/classes/:classId/assignments/:assignmentId", () => {
    renderWithProviders(<OrgClassDetailPage />);
    expect(screen.getByTestId("assignments").getAttribute("href")).toBe("/org/classes/c1/assignments/a7");
  });
});
