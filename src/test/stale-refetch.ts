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

/** Câu của `StaleDataNotice`: mặc định, hoặc dạng `resourceLabel` ("Không làm mới được <phần nào>, ..."). */
export const STALE_NOTICE_TEXT = /Không cập nhật được dữ liệu mới|Không làm mới được/;

/**
 * Thông báo gọn "không cập nhật được" (role=status) có nút "Thử lại", và KHÔNG có hộp lỗi thay danh sách.
 * `retryButtons` = số nút "Thử lại" mong đợi (mặc định 1: một notice duy nhất, Q10 #148 M3).
 */
export async function expectStaleNoticeWithRetry(retryButtons = 1) {
  const notice = await screen.findByText(STALE_NOTICE_TEXT);
  expect(notice.closest("[role=status]")).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "Thử lại" })).toHaveLength(retryButtons);
  expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull();
}

/** Số thông báo "dữ liệu cũ" đang hiện (0 khi chưa lỗi). */
export function staleNoticeCount() {
  return screen.queryAllByText(STALE_NOTICE_TEXT).length;
}
