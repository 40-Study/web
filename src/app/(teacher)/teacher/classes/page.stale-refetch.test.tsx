/**
 * Q10-T-03: /teacher/classes tải được, rồi refetch nền (GET /classes/me) lỗi 500: giữ danh sách lớp đã có và báo gọn,
 * không thay cả danh sách bằng "Không tải được danh sách lớp". Lần tải đầu lỗi vẫn là hộp lỗi + "Thử lại".
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import TeacherClassesPage from "./page";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const CLASS = { id: "cl-1", course_id: "co-1", name: "Toán 9A", status: "active", student_count: 12, teacher_count: 1 };

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  mockApi.get.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return envelope({ classes: [CLASS] });
  });
});

describe("/teacher/classes — Q10-T-03", () => {
  it("refetch nền lỗi: vẫn liệt kê lớp + thông báo 'Thử lại', không có hộp lỗi", async () => {
    const { queryClient } = renderWithProviders(<TeacherClassesPage />);
    await screen.findByText("Toán 9A");

    failing = true;
    await refetchAllActiveQueries(queryClient);

    await expectStaleNoticeWithRetry();
    expect(screen.getByText("Toán 9A")).toBeTruthy();
    expect(screen.queryByText("Không tải được danh sách lớp. Vui lòng thử lại.")).toBeNull();
  });

  it("lần tải đầu lỗi: hộp lỗi + 'Thử lại' (không có thông báo dữ liệu cũ)", async () => {
    failing = true;
    renderWithProviders(<TeacherClassesPage />);
    expect((await screen.findByRole("alert")).textContent).toContain("Không tải được danh sách lớp");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
    expect(screen.queryByText(/Không cập nhật được dữ liệu mới/)).toBeNull();
  });
});
