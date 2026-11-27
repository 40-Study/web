/**
 * Q10-STU-01: /my-grades tải được, rồi refetch nền lỗi 500: điểm đã có phải còn nguyên kèm thông báo "Thử lại" (trước đây cả
 * trang đổi thành hộp lỗi vì nhánh `error ?` không xét dữ liệu cache). Lần tải đầu lỗi vẫn là hộp lỗi.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import MyGradesPage from "./page";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const GRADE = {
  id: "g1", class_id: "cl-1", class_name: "Toán 9A", student_id: "s1", grade_type: "assignment",
  title: "Bài kiểm tra chương 3", score: 8, max_score: 10, graded_at: "2026-11-20T10:00:00Z",
};

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  mockApi.get.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return envelope([GRADE]);
  });
});

describe("/my-grades — Q10-STU-01", () => {
  it("refetch nền lỗi: điểm còn nguyên + thông báo 'Thử lại', không có hộp lỗi", async () => {
    const { queryClient } = renderWithProviders(<MyGradesPage />);
    await screen.findByText("Bài kiểm tra chương 3");

    failing = true;
    await refetchAllActiveQueries(queryClient);

    await expectStaleNoticeWithRetry();
    expect(screen.getByText("Bài kiểm tra chương 3")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("lần tải đầu lỗi: hộp lỗi + 'Thử lại', không có thông báo dữ liệu cũ", async () => {
    failing = true;
    renderWithProviders(<MyGradesPage />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
    expect(screen.queryByText(/Không cập nhật được dữ liệu mới/)).toBeNull();
  });
});
