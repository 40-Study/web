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
// `user: null` mô phỏng chưa có user id (M2): trang /achievements không được gọi profile khi retry.
const authState = vi.hoisted(() => ({ user: { id: "u1", name: "Học viên" } as { id: string; name: string } | null }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: Object.assign(
    (selector?: (s: typeof authState) => unknown) => (selector ? selector(authState) : authState),
    { getState: () => authState }
  ),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
// Lưới giả vẫn báo `range` lên như lưới thật, để truy vấn timetable (cần range) chạy cùng nguồn livestream.
vi.mock("@/components/schedule/week-calendar-grid", async () => {
  const { useEffect } = await import("react");
  function StubWeekCalendarGrid({ onRangeChange }: { onRangeChange?: (start: Date, end: Date) => void }) {
    useEffect(() => {
      onRangeChange?.(new Date(2026, 10, 23), new Date(2026, 10, 30));
    }, [onRangeChange]);
    return <div data-testid="grid" />;
  }
  return { default: StubWeekCalendarGrid };
});
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
  beforeEach(() => {
    resetMockApi();
    authState.user = { id: "u1", name: "Học viên" };
  });

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
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Chưa tải được đầy đủ lịch học");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });

  const callsTo = (url: string) => mockApi.get.mock.calls.filter(([u]) => u === url).length;
  const ok = (data: unknown) => Promise.resolve({ data: { data } });

  // M1: nguồn timetable lỗi (livestream ổn): banner hiện, Thử lại chỉ gọi lại timetable, không đụng nguồn khoẻ.
  it("/schedule: timetable lỗi hiện banner; Thử lại chỉ gọi lại timetable, không gọi lại livestream", async () => {
    let timetableFails = true;
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/me/timetable") return timetableFails ? Promise.reject(new Error("500")) : ok({ entries: [] });
      if (url === "/livestream") return Promise.resolve({ data: { data: [], total: 0 } });
      return Promise.reject(new Error(`unexpected GET ${url}`));
    });
    renderWithProviders(<SchedulePage />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Chưa tải được đầy đủ lịch học");
    await waitFor(() => expect(callsTo("/livestream")).toBe(1));
    expect(callsTo("/me/timetable")).toBe(1);

    timetableFails = false;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    await waitFor(() => expect(callsTo("/me/timetable")).toBe(2));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(callsTo("/livestream")).toBe(1);
  });

  // M2: chỉ nguồn lỗi được gọi lại; profile đã có dữ liệu thì không refetch.
  it("/achievements: Thử lại chỉ gọi lại truy vấn lỗi, không refetch profile đã có dữ liệu", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/achievements/me") return Promise.reject(new Error("500"));
      if (url === "/users/u1/public-profile") return ok({ stats: {} });
      return ok({ data: [], total: 0 });
    });
    renderWithProviders(<AchievementsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));

    await waitFor(() => expect(callsTo("/achievements/me")).toBe(2));
    expect(callsTo("/users/u1/public-profile")).toBe(1);
  });

  // M2: refetch() bỏ qua `enabled`, nên không có user id thì không được bắn getPublicProfile("").
  it("/achievements: không có user id thì Thử lại không gọi profile", async () => {
    authState.user = null;
    mockApi.get.mockImplementation((url: string) =>
      url === "/achievements/me" ? Promise.reject(new Error("500")) : ok({ data: [], total: 0 })
    );
    renderWithProviders(<AchievementsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));

    await waitFor(() => expect(callsTo("/achievements/me")).toBe(2));
    expect(mockApi.get.mock.calls.some(([u]) => String(u).startsWith("/users/"))).toBe(false);
  });

  // L1: lỗi ở trang 2+ không có placeholderData; vẫn phải có nút "Trước" để quay lại trang 1.
  it.each([
    { name: "/certificates", page: <CertificatesPage />, url: "/certificates", page1: { data: Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, course_name: `Khoá ${i}`, certificate_number: `CN-${i}` })), total: 24 } },
    { name: "/my-attendance", page: <MyAttendancePage />, url: "/me/attendances", page1: { attendances: [{ id: "a1", session_id: "s1", student_id: "u1", status: "present", created_at: "2026-11-20T01:00:00Z" }], total: 40 } },
  ])("$name: lỗi ở trang 2 vẫn còn nút Trước để quay lại", async ({ page, url, page1 }) => {
    mockApi.get.mockImplementation((u: string, config?: { params?: { page?: number } }) => {
      if (u !== url) return ok({ data: [], total: 0, attendances: [] });
      return config?.params?.page === 2 ? Promise.reject(new Error("500")) : ok(page1);
    });
    renderWithProviders(page);
    fireEvent.click(await screen.findByRole("button", { name: "Sau" }));

    expect((await screen.findAllByRole("alert"))[0].textContent).toContain("Không thể tải dữ liệu");
    const back = screen.getByRole("button", { name: "Trước" });
    mockApi.get.mockImplementation(() => ok({ data: [], total: 0, attendances: [] }));
    fireEvent.click(back);
    await waitFor(() => expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull());
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
