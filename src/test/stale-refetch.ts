/**
 * Q10 (STU-01 / T-03 / PG-01 / ADMIN-01): mô phỏng "refetch nền lỗi khi cache còn dữ liệu" bằng đúng cơ chế của
 * react-query: trang đã tải được, sau đó mọi query đang mở bị làm mới và lần này API lỗi. `data` cũ được giữ, `isError` bật.
 */
import { act, screen } from "@testing-library/react";
import type { QueryClient } from "@tanstack/react-query";
import { expect } from "vitest";

/** Làm mới mọi query đang mở (bạn phải đã đổi mock API sang lỗi trước khi gọi). */
export async function refetchAllActiveQueries(queryClient: QueryClient) {
  await act(async () => {
    await queryClient.invalidateQueries();
  });
}

/** Thông báo gọn "không cập nhật được" (role=status) có nút "Thử lại", và KHÔNG có hộp lỗi thay danh sách. */
export async function expectStaleNoticeWithRetry() {
  const notice = await screen.findByText(/Không cập nhật được dữ liệu mới/);
  expect(notice.closest("[role=status]")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull();
}
