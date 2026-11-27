/**
 * Q10 #148 M3/L1/L3: trang chủ có 4 query. Khi backend sập mà còn cache: MỘT thông báo cấp trang (không mỗi widget một thanh
 * + một live region). Query lỗi lần đầu vẫn hiện hộp lỗi RIÊNG trong widget của nó, retry đúng query lỗi và có trạng thái bận.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Q = { data: unknown; isLoading: boolean; isError: boolean; refetch: ReturnType<typeof vi.fn> };
const q = (data: unknown, isError = false): Q => ({ data, isLoading: false, isError, refetch: vi.fn(async () => undefined) });
let enrolled: Q;
let schedule: Q;
let featured: Q;
let profile: Q;

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (select: (s: { user: { id: string; name: string } }) => unknown) => select({ user: { id: "u1", name: "An" } }),
}));
vi.mock("@/hooks/use-courses", () => ({
  useEnrolledCourses: () => enrolled,
  useFeaturedCourses: () => featured,
}));
vi.mock("@/hooks/queries/use-class-schedule", () => ({ useMySchedules: () => schedule }));
vi.mock("@/hooks/queries/use-user-stats", () => ({ usePublicProfile: () => profile }));

import { HomeDashboard } from "./home-dashboard";

const PROFILE = { stats: { total_points: 100, level: 2, level_progress: 30, current_streak: 3, longest_streak: 5 }, activity: [] };

beforeEach(() => {
  localStorage.clear();
  enrolled = q([]);
  schedule = q([]);
  featured = q([]);
  profile = q(PROFILE);
});

describe("HomeDashboard — Q10 #148", () => {
  it("không lỗi: không có thông báo dữ liệu cũ", () => {
    render(<HomeDashboard />);
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("M3: cả bốn query lỗi mà còn cache: MỘT thông báo + MỘT nút 'Thử lại', không hộp lỗi trong widget", () => {
    enrolled = q([], true);
    schedule = q([], true);
    featured = q([], true);
    profile = q(PROFILE, true);
    render(<HomeDashboard />);
    expect(screen.getAllByText(/Không làm mới được/)).toHaveLength(1);
    expect(screen.getAllByRole("status").filter((el) => /Không làm mới được/.test(el.textContent ?? ""))).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Thử lại" })).toHaveLength(1);
    expect(screen.queryByRole("alert")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    for (const query of [enrolled, schedule, featured, profile]) expect(query.refetch).toHaveBeenCalledTimes(1);
  });

  it("chỉ một query lỗi mà còn cache: thông báo, retry chỉ query đó", () => {
    schedule = q([], true);
    render(<HomeDashboard />);
    expect(screen.getAllByText(/Không làm mới được/)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(schedule.refetch).toHaveBeenCalledTimes(1);
    expect(enrolled.refetch).not.toHaveBeenCalled();
    expect(profile.refetch).not.toHaveBeenCalled();
  });

  it("L1: 'khoá nổi bật' lỗi LẦN ĐẦU còn 'khoá của tôi' có cache: hộp lỗi riêng, không ghi 'dữ liệu cũ'; retry làm mới mọi query đang lỗi", () => {
    featured = q(undefined, true);
    enrolled = q([], true);
    render(<HomeDashboard />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Chưa tải được dữ liệu");
    // khoá của tôi lỗi nhưng còn cache nên thuộc thông báo cấp trang, không lẫn vào widget gợi ý
    expect(screen.getAllByText(/Không làm mới được/)).toHaveLength(1);
    fireEvent.click(within(alert).getByRole("button", { name: "Thử lại" }));
    expect(featured.refetch).toHaveBeenCalledTimes(1);
    expect(enrolled.refetch).toHaveBeenCalledTimes(1);
  });

  it("L3: nút 'Thử lại' trong hộp lỗi widget hiện trạng thái bận khi refetch còn chạy", async () => {
    profile = { ...q(undefined, true), refetch: vi.fn(() => new Promise(() => {})) };
    render(<HomeDashboard />);
    const retry = screen.getAllByRole("alert")[0].querySelector("button") as HTMLButtonElement;
    fireEvent.click(retry);
    expect(await screen.findAllByRole("button", { name: "Đang tải lại…" })).not.toHaveLength(0);
  });
});
