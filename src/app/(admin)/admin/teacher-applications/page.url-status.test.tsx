/** QA8-A11: lọc trạng thái hồ sơ giảng viên nằm trên URL (?status=). */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockList = vi.fn();
const replace = vi.fn();
let search = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/admin/teacher-applications",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/hooks/queries/use-teacher-application", () => ({
  useAdminTeacherApplications: (...args: unknown[]) => mockList(...args),
  useApproveTeacherApplication: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectTeacherApplication: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/admin/teacher-application-detail-dialog", () => ({ TeacherApplicationDetailDialog: () => null }));
vi.mock("@/stores/auth.store", () => {
  const state = { permissions: ["TEACHER_APPROVE"], sessionStatus: "authenticated" };
  return { useAuthStore: (selector: (s: typeof state) => unknown) => selector(state) };
});

import AdminTeacherApplicationsPage from "./page";

beforeEach(() => {
  replace.mockReset();
  mockList.mockReset();
  mockList.mockReturnValue({
    data: { applications: [], total: 0, page: 1, limit: 20 }, isLoading: false, isError: false, error: null, refetch: vi.fn(),
  });
});

describe("/admin/teacher-applications — QA8-A11 bộ lọc trạng thái trên URL", () => {
  it("mở ?status=approved: ô lọc và truy vấn dùng 'approved'", () => {
    search = "status=approved";
    render(<AdminTeacherApplicationsPage />);
    expect((screen.getByTestId("application-status-filter") as HTMLSelectElement).value).toBe("approved");
    expect(mockList.mock.calls.at(-1)?.[0]).toMatchObject({ status: "approved" });
  });

  it("đổi bộ lọc ghi status lên URL; về 'Chờ duyệt' thì bỏ khỏi URL", () => {
    search = "";
    const { unmount } = render(<AdminTeacherApplicationsPage />);
    fireEvent.change(screen.getByTestId("application-status-filter"), { target: { value: "rejected" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/teacher-applications?status=rejected", { scroll: false });
    unmount();

    search = "status=rejected";
    render(<AdminTeacherApplicationsPage />);
    fireEvent.change(screen.getByTestId("application-status-filter"), { target: { value: "pending" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/teacher-applications", { scroll: false });
  });
});
