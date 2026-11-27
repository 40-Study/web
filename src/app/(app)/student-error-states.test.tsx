/**
 * Q9-STU-01 / Q9-STU-02: GET lỗi (500) ở các trang học viên không được đọc thành dữ liệu rỗng/0
 * ("Chưa có buổi học nào", "0 bài tập", "Bạn chưa có chứng chỉ nào", "0 HUY HIỆU", "Bạn chưa tham gia nhóm nào");
 * mọi trang phải có thông báo lỗi + nút "Thử lại" (khuôn QueryState như /wishlist, /orders).
 * Dùng hook + service thật, chỉ giả tầng HTTP.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/" }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: Object.assign(
    (selector?: (s: { user: { id: string; name: string } }) => unknown) => {
      const state = { user: { id: "u1", name: "Học viên" } };
      return selector ? selector(state) : state;
    },
    { getState: () => ({ user: { id: "u1" } }) }
  ),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/components/schedule/week-calendar-grid", () => ({ default: () => <div data-testid="grid" /> }));
vi.mock("@/components/schedule/schedule-event-detail-dialog", () => ({ default: () => null }));

import AchievementsPage from "./achievements/page";
import CertificatesPage from "./certificates/page";
import GroupsPage from "./groups/page";
import LivestreamPage from "./livestream/page";
import MyAssignmentsPage from "./my-assignments/page";
import MyAttendancePage from "./my-attendance/page";
import MyVouchersPage from "./my-vouchers/page";
import SchedulePage from "./schedule/page";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

/** Mọi GET lỗi 500; trang không được hiện nội dung rỗng/0 thay cho lỗi. */
const failAllGets = () => mockApi.get.mockRejectedValue(new Error("Request failed with status code 500"));

const PAGES: Array<{ name: string; page: ReactElement; notShown: RegExp[] }> = [
  { name: "/my-attendance", page: <MyAttendancePage />, notShown: [/Chưa có buổi học nào được điểm danh/] },
  { name: "/my-assignments", page: <MyAssignmentsPage />, notShown: [/Bạn có 0 bài tập/, /Hiển thị 0 trong số 0/] },
  { name: "/certificates", page: <CertificatesPage />, notShown: [/Bạn chưa có chứng chỉ nào/] },
  { name: "/achievements", page: <AchievementsPage />, notShown: [/Chưa có huy hiệu nào/, /TỔNG XP/] },
  { name: "/groups", page: <GroupsPage />, notShown: [/Bạn chưa tham gia nhóm nào/] },
  { name: "/my-vouchers", page: <MyVouchersPage />, notShown: [/Bạn chưa có voucher nào/] },
  { name: "/livestream", page: <LivestreamPage />, notShown: [/Chưa có buổi học trực tiếp nào/] },
];

describe("trang học viên: GET lỗi hiện lỗi + Thử lại, không hiện rỗng/0 (Q9-STU-01/02)", () => {
  beforeEach(() => resetMockApi());

  it.each(PAGES)("$name", async ({ page, notShown }) => {
    failAllGets();
    renderWithProviders(page);
    expect((await screen.findAllByRole("alert"))[0].textContent).toContain("Không thể tải dữ liệu");
    expect(screen.getAllByRole("button", { name: "Thử lại" }).length).toBeGreaterThan(0);
    for (const text of notShown) expect(screen.queryByText(text)).toBeNull();
  });

  it("/schedule: banner lỗi có nút Thử lại", async () => {
    failAllGets();
    renderWithProviders(<SchedulePage />);
    // `range` do lưới lịch báo lên; lưới được giả nên chỉ nguồn buổi livestream chạy: đủ để banner hiện.
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Chưa tải được đầy đủ lịch học");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });

  it("/my-attendance: Thử lại gọi lại API và hiện dữ liệu khi lần sau thành công", async () => {
    mockApi.get.mockRejectedValue(new Error("Request failed with status code 500"));
    renderWithProviders(<MyAttendancePage />);
    const retry = await screen.findByRole("button", { name: "Thử lại" });

    mockApi.get.mockResolvedValue({ data: { data: { attendances: [], total: 0 } } });
    fireEvent.click(retry);

    await waitFor(() => expect(screen.getByText("Chưa có buổi học nào được điểm danh.")).toBeTruthy());
    expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull();
  });
});
