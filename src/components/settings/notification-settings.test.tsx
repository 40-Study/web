/**
 * N-05 (QA4 261123): phụ huynh mở Cài đặt > Thông báo từng thấy các hàng chỉ dành cho người học (chuỗi học,
 * thành tích, bảng xếp hạng). Phụ huynh chỉ còn những hàng áp dụng cho họ; học viên giữ đủ danh sách.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("@/hooks/queries/use-notification-settings", () => ({
  useNotificationSettings: () => ({ data: {}, isLoading: false }),
  useUpdateNotificationSettings: () => ({ mutate: vi.fn() }),
}));

import { NotificationSettings } from "./notification-settings";

const LEARNER_ONLY = ["Nhắc nhở chuỗi học", "Mở khoá thành tích", "Thay đổi bảng xếp hạng"];

afterEach(() => useAuthStore.setState({ activeRole: null }));

describe("NotificationSettings: hàng theo vai trò", () => {
  it("phụ huynh: ẩn ba hàng của người học, giữ cập nhật khoá học và khuyến mãi", () => {
    useAuthStore.setState({ activeRole: "PARENT" });
    render(<NotificationSettings />);
    for (const title of LEARNER_ONLY) expect(screen.queryByText(title)).toBeNull();
    expect(screen.getByText("Cập nhật khoá học")).toBeTruthy();
    expect(screen.getByText("Khuyến mãi & Tin tức")).toBeTruthy();
  });

  it("học viên: đủ năm hàng", () => {
    useAuthStore.setState({ activeRole: "STUDENT" });
    render(<NotificationSettings />);
    for (const title of LEARNER_ONLY) expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText("Cập nhật khoá học")).toBeTruthy();
  });
});
