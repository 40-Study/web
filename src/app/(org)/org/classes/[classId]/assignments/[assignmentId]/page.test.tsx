/**
 * R7: trang chấm bài trong khu tổ chức chỉ ghép SubmissionGradingPanel (không viết UI chấm mới) với breadcrumb về lớp.
 * Test ĐỎ nếu trang truyền sai assignmentId, bỏ breadcrumb, đổi hợp đồng props của panel, hoặc bỏ kiểm bài tập thuộc lớp.
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockAssignment: { title: string; class_id?: string } | undefined;

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
  it("bài tập khớp lớp trên URL: render SubmissionGradingPanel với đúng một prop assignmentId", () => {
    mockAssignment = { title: "Bài tập giỏ hàng", class_id: "c1" };
    renderWithProviders(<OrgAssignmentGradingPage />);
    expect(JSON.parse(screen.getByTestId("panel").getAttribute("data-props") ?? "{}")).toEqual({ assignmentId: "a9" });
  });

  it("breadcrumb dẫn về danh sách lớp và chi tiết lớp, mục cuối là tên bài tập", () => {
    mockAssignment = { title: "Bài tập giỏ hàng", class_id: "c1" };
    renderWithProviders(<OrgAssignmentGradingPage />);

    expect(screen.getByRole("link", { name: "Lớp học" }).getAttribute("href")).toBe("/org/classes");
    expect(screen.getByRole("link", { name: "Chi tiết lớp" }).getAttribute("href")).toBe("/org/classes/c1");
    expect(screen.getByText("Bài tập giỏ hàng").getAttribute("aria-current")).toBe("page");
  });

  it("bài tập thuộc lớp khác với lớp trên URL: 'Không tìm thấy bài tập', không render panel, không lộ tên bài", () => {
    mockAssignment = { title: "Bài của lớp B", class_id: "c2" };
    renderWithProviders(<OrgAssignmentGradingPage />);

    expect(screen.getByText("Không tìm thấy bài tập")).toBeTruthy();
    expect(screen.queryByTestId("panel")).toBeNull();
    expect(screen.queryByText("Bài của lớp B")).toBeNull();
  });

  it("chưa có dữ liệu bài tập (đang tải hoặc 404): mục cuối là 'Chấm bài', panel tự xử lý lỗi", () => {
    renderWithProviders(<OrgAssignmentGradingPage />);
    expect(screen.getByText("Chấm bài").getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("panel")).toBeTruthy();
  });
});
