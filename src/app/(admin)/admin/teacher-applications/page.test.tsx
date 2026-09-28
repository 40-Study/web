/**
 * /admin/teacher-applications (Phase 3) — duyệt gọi đúng userId (KHÔNG phải profile_id: route
 * backend là /admin/teacher-applications/:userId/approve), từ chối bắt buộc lý do.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TeacherApplicationItem } from "@/types/approval";

const mockUseList = vi.fn();
const mockApprove = vi.fn();
const mockReject = vi.fn();

vi.mock("@/hooks/queries/use-teacher-application", () => ({
  useAdminTeacherApplications: (...args: unknown[]) => mockUseList(...args),
  useApproveTeacherApplication: () => ({ mutate: mockApprove, isPending: false }),
  useRejectTeacherApplication: () => ({ mutate: mockReject, isPending: false }),
}));

const authState = { permissions: ["ROLES_MANAGE_SYSTEM"], sessionStatus: "authenticated" as const };
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// eslint-disable-next-line import/first
import AdminTeacherApplicationsPage from "./page";

function buildItem(overrides: Partial<TeacherApplicationItem> = {}): TeacherApplicationItem {
  return {
    user_id: "user-42",
    profile_id: "profile-7",
    email: "ungvien@fortex.vn",
    full_name: "Trần Thị B",
    specialization: "Vật lý",
    education: "Cử nhân Sư phạm Vật lý",
    experience_years: 3,
    certificate_info: "Chứng chỉ nghiệp vụ sư phạm",
    department: "Khoa học tự nhiên",
    approval_status: "pending",
    resubmission_count: 1,
    created_at: "2026-09-27T01:00:00Z",
    updated_at: "2026-09-28T01:00:00Z",
    ...overrides,
  };
}

describe("/admin/teacher-applications — duyệt giáo viên", () => {
  beforeEach(() => {
    mockApprove.mockReset();
    mockReject.mockReset();
    mockUseList.mockReset();
    mockUseList.mockReturnValue({
      data: { items: [buildItem()], total_count: 1, page: 1, limit: 20, total_pages: 1 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("mặc định lọc pending và hiện họ tên/email/chuyên môn/số lần nộp lại", () => {
    render(<AdminTeacherApplicationsPage />);

    expect(mockUseList).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", page: 1 }));
    expect(screen.getByText("Trần Thị B")).toBeTruthy();
    expect(screen.getByText("ungvien@fortex.vn")).toBeTruthy();
    expect(screen.getByText("Vật lý")).toBeTruthy();
    expect(screen.getByText("3 năm")).toBeTruthy();
  });

  it("duyệt: xác nhận xong gọi approve với user_id (không phải profile_id)", () => {
    render(<AdminTeacherApplicationsPage />);

    fireEvent.click(screen.getByTestId("application-approve"));
    fireEvent.click(screen.getByTestId("approve-confirm"));

    expect(mockApprove).toHaveBeenCalledTimes(1);
    expect(mockApprove.mock.calls[0][0]).toBe("user-42");
  });

  it("từ chối: disabled khi chưa nhập lý do, gửi {userId, reason} khi đã nhập", () => {
    render(<AdminTeacherApplicationsPage />);

    fireEvent.click(screen.getByTestId("application-reject"));
    const submit = screen.getByTestId("reject-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByTestId("reject-reason"), {
      target: { value: "Chưa có minh chứng bằng cấp" },
    });
    fireEvent.click(submit);

    expect(mockReject.mock.calls[0][0]).toEqual({
      userId: "user-42",
      reason: "Chưa có minh chứng bằng cấp",
    });
  });

  it("xem chi tiết: dialog hiện học vấn + bằng cấp", () => {
    render(<AdminTeacherApplicationsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Xem chi tiết" }));
    expect(screen.getByTestId("application-detail-dialog")).toBeTruthy();
    expect(screen.getByText("Cử nhân Sư phạm Vật lý")).toBeTruthy();
    expect(screen.getByText("Chứng chỉ nghiệp vụ sư phạm")).toBeTruthy();
  });
});
