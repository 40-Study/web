/**
 * /teacher-application (Phase 3) — 3 nhánh quan trọng của trang ứng viên:
 * chưa có hồ sơ (404 → null) hiện form tạo; bị từ chối còn lượt → "Nộp lại" (PUT rồi resubmit);
 * bị từ chối hết lượt → thông báo liên hệ hỗ trợ, không có form.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MyTeacherApplication } from "@/types/approval";

const mockUseMine = vi.fn();
const mockCreate = vi.fn();
const mockResubmit = vi.fn();

vi.mock("@/hooks/queries/use-teacher-application", () => ({
  useMyTeacherApplication: () => mockUseMine(),
  useCreateTeacherApplication: () => ({ mutate: mockCreate, isPending: false }),
  useResubmitTeacherApplication: () => ({ mutate: mockResubmit, isPending: false }),
}));

// eslint-disable-next-line import/first
import TeacherApplicationPage from "./page";

function mine(data: MyTeacherApplication | null) {
  mockUseMine.mockReturnValue({ data, isLoading: false, isError: false, error: null, refetch: vi.fn() });
}

function rejected(overrides: Partial<MyTeacherApplication> = {}): MyTeacherApplication {
  return {
    id: "profile-7",
    user_id: "user-42",
    specialization: "Vật lý",
    education: "Cử nhân",
    experience_years: 2,
    created_at: "2026-09-27T01:00:00Z",
    updated_at: "2026-09-28T01:00:00Z",
    approval_status: "rejected",
    rejection_reason: "Thiếu minh chứng bằng cấp",
    resubmission_count: 1,
    max_resubmissions: 3,
    can_resubmit: true,
    ...overrides,
  };
}

describe("/teacher-application — hồ sơ ứng viên giảng viên", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockResubmit.mockReset();
  });

  it("chưa có hồ sơ (404): hiện form tạo, nộp gửi đúng các field đã nhập", () => {
    mine(null);
    render(<TeacherApplicationPage />);

    expect(screen.getByTestId("teacher-application-form")).toBeTruthy();
    const submit = screen.getByTestId("application-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true); // chưa nhập chuyên môn

    fireEvent.change(screen.getByLabelText(/Chuyên môn/), { target: { value: "Toán THPT" } });
    fireEvent.change(screen.getByLabelText("Số năm kinh nghiệm"), { target: { value: "5" } });
    fireEvent.click(submit);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0]).toEqual({
      specialization: "Toán THPT",
      education: undefined,
      experience_years: 5,
      certificate_info: undefined,
      department: undefined,
    });
  });

  it("bị từ chối + can_resubmit: hiện lý do và nút 'Nộp lại' gửi profileId + dữ liệu form", () => {
    mine(rejected());
    render(<TeacherApplicationPage />);

    expect(screen.getByText("Thiếu minh chứng bằng cấp")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Nộp lại" }));

    expect(mockResubmit).toHaveBeenCalledTimes(1);
    const [payload] = mockResubmit.mock.calls[0] as [{ profileId: string; data: { specialization?: string } }];
    expect(payload.profileId).toBe("profile-7");
    expect(payload.data.specialization).toBe("Vật lý");
    expect(screen.queryByTestId("application-resubmit-limit")).toBeNull();
  });

  it("bị từ chối + can_resubmit=false: thông báo liên hệ hỗ trợ, không có nút Nộp lại", () => {
    mine(rejected({ resubmission_count: 3, can_resubmit: false }));
    render(<TeacherApplicationPage />);

    expect(
      screen.getByText("Bạn đã nộp lại tối đa 3 lần. Vui lòng liên hệ bộ phận hỗ trợ để được xem xét.")
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Nộp lại" })).toBeNull();
  });

  it("đang chờ duyệt: banner 'Hồ sơ đang chờ duyệt', không có form", () => {
    mine(rejected({ approval_status: "pending", rejection_reason: undefined, can_resubmit: false }));
    render(<TeacherApplicationPage />);

    expect(screen.getByText("Hồ sơ đang chờ duyệt")).toBeTruthy();
    expect(screen.queryByTestId("teacher-application-form")).toBeNull();
  });
});
