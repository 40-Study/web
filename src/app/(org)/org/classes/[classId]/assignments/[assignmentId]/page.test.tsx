/**
 * R7: trang chấm bài trong khu tổ chức chỉ ghép SubmissionGradingPanel (không viết UI chấm mới) với breadcrumb về lớp.
 * Test ĐỎ nếu trang truyền sai assignmentId, bỏ breadcrumb, hoặc đổi hợp đồng props của panel.
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockAssignment: { title: string } | undefined;

vi.mock("next/navigation", () => ({
  useParams: () => ({ classId: "c1", assignmentId: "a9" }),
}));
vi.mock("@/hooks/queries/use-assignments", () => ({
  useAssignment: () => ({ data: mockAssignment }),
}));
vi.mock("@/components/grading/submission-grading-panel", () => ({
  SubmissionGradingPanel: (props: Record<string, unknown>) => (
    <div data-testid="panel" data-props={JSON.stringify(props)} />
  ),
}));

import OrgAssignmentGradingPage from "./page";
import { renderWithProviders } from "@/test/utils";

beforeEach(() => {
  mockAssignment = undefined;
});

describe("OrgAssignmentGradingPage", () => {
  it("render SubmissionGradingPanel với đúng một prop assignmentId lấy từ URL", () => {
    renderWithProviders(<OrgAssignmentGradingPage />);
    expect(JSON.parse(screen.getByTestId("panel").getAttribute("data-props") ?? "{}")).toEqual({ assignmentId: "a9" });
  });

  it("breadcrumb dẫn về danh sách lớp và chi tiết lớp, mục cuối là tên bài tập", () => {
    mockAssignment = { title: "Bài tập giỏ hàng" };
    renderWithProviders(<OrgAssignmentGradingPage />);

    expect(screen.getByRole("link", { name: "Lớp học" }).getAttribute("href")).toBe("/org/classes");
    expect(screen.getByRole("link", { name: "Chi tiết lớp" }).getAttribute("href")).toBe("/org/classes/c1");
    expect(screen.getByText("Bài tập giỏ hàng").getAttribute("aria-current")).toBe("page");
  });

  it("chưa có tên bài tập (đang tải hoặc 404): mục cuối là 'Chấm bài', panel vẫn tự xử lý lỗi", () => {
    renderWithProviders(<OrgAssignmentGradingPage />);
    expect(screen.getByText("Chấm bài").getAttribute("aria-current")).toBe("page");
  });
});
