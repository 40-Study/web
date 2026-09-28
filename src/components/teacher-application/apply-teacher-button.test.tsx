/**
 * Nút "Đăng ký làm giảng viên" ở /settings (Phase 3) — lối vào cho user ĐÃ có vai trò.
 * Chuỗi API bắt buộc: GET /auth/system-roles → POST /auth/me/profiles {system_role_id} →
 * POST /auth/switch-role {role_id: SystemRole.ID, role_type:"system"}.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

const mockGetAllSystemRoles = vi.fn();
const mockCreateProfile = vi.fn();
const mockSwitchRole = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/services/auth.service", () => ({
  authService: {
    getAllSystemRoles: () => mockGetAllSystemRoles(),
    createProfile: (data: unknown) => mockCreateProfile(data),
  },
}));

vi.mock("@/hooks/queries/use-auth", () => ({
  useSwitchRole: () => ({ mutateAsync: mockSwitchRole, isPending: false }),
}));

vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a), success: vi.fn() } }));

type Role = {
  id: string;
  type: "system" | "organization";
  role_name: string;
  display_name: string;
  organization_id?: string;
};
let authState: { roles: Role[]; activeRole: string | null } = { roles: [], activeRole: null };
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// eslint-disable-next-line import/first
import { ApplyTeacherButton } from "./apply-teacher-button";

const role = (id: string, name: string): Role => ({ id, type: "system", role_name: name, display_name: name });

const SYSTEM_ROLES = {
  system_roles: [
    { id: "sr-student", name: "STUDENT" },
    { id: "sr-parent", name: "PARENT" },
    { id: "sr-applicant", name: "TEACHER_APPLICANT" },
  ],
};

describe("ApplyTeacherButton", () => {
  beforeEach(() => {
    mockGetAllSystemRoles.mockReset().mockResolvedValue(SYSTEM_ROLES);
    mockCreateProfile.mockReset().mockResolvedValue({ message: "ok", data: {} });
    mockSwitchRole.mockReset().mockResolvedValue({});
    mockToastError.mockReset();
    authState = { roles: [role("sr-student", "STUDENT")], activeRole: "STUDENT" };
  });

  it("học viên: system-roles → createProfile(id TEACHER_APPLICANT) → switch-role đúng thứ tự", async () => {
    render(<ApplyTeacherButton />);
    const btn = screen.getByTestId("apply-teacher-button");
    expect(btn.textContent).toContain("Đăng ký làm giảng viên");

    fireEvent.click(btn);

    await waitFor(() => expect(mockSwitchRole).toHaveBeenCalledTimes(1));
    expect(mockGetAllSystemRoles).toHaveBeenCalledTimes(1);
    expect(mockCreateProfile).toHaveBeenCalledWith({ system_role_id: "sr-applicant" });
    expect(mockSwitchRole).toHaveBeenCalledWith({ role_id: "sr-applicant", role_type: "system" });
    expect(mockCreateProfile.mock.invocationCallOrder[0]).toBeLessThan(
      mockSwitchRole.mock.invocationCallOrder[0]
    );
  });

  it("backend báo 'you already have this profile' → vẫn switch-role, không toast lỗi", async () => {
    mockCreateProfile.mockRejectedValue(new ApiError(400, "UNKNOWN", "you already have this profile"));
    render(<ApplyTeacherButton />);

    fireEvent.click(screen.getByTestId("apply-teacher-button"));

    await waitFor(() => expect(mockSwitchRole).toHaveBeenCalledTimes(1));
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("createProfile lỗi khác → toast tiếng Việt, KHÔNG switch-role", async () => {
    mockCreateProfile.mockRejectedValue(new ApiError(400, "UNKNOWN", "boom"));
    render(<ApplyTeacherButton />);

    fireEvent.click(screen.getByTestId("apply-teacher-button"));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1));
    expect(mockSwitchRole).not.toHaveBeenCalled();
  });

  it("đã có TEACHER_APPLICANT: nút 'Xem hồ sơ ứng tuyển' chỉ switch-role, không tạo profile", async () => {
    authState = {
      roles: [role("sr-student", "STUDENT"), role("sr-applicant", "TEACHER_APPLICANT")],
      activeRole: "STUDENT",
    };
    render(<ApplyTeacherButton />);
    const btn = screen.getByTestId("apply-teacher-button");
    expect(btn.textContent).toContain("Xem hồ sơ ứng tuyển");

    fireEvent.click(btn);

    await waitFor(() => expect(mockSwitchRole).toHaveBeenCalledTimes(1));
    expect(mockSwitchRole).toHaveBeenCalledWith({ role_id: "sr-applicant", role_type: "system" });
    expect(mockGetAllSystemRoles).not.toHaveBeenCalled();
    expect(mockCreateProfile).not.toHaveBeenCalled();
  });

  it("đã là TEACHER: không hiện nút", () => {
    authState = { roles: [role("sr-teacher", "TEACHER")], activeRole: "TEACHER" };
    render(<ApplyTeacherButton />);
    expect(screen.queryByTestId("apply-teacher-button")).toBeNull();
  });

  it("SYSTEM_ADMIN: không hiện nút (tránh tự tạo profile ứng viên cho quản trị viên)", () => {
    authState = { roles: [role("sr-admin", "SYSTEM_ADMIN")], activeRole: "SYSTEM_ADMIN" };
    render(<ApplyTeacherButton />);
    expect(screen.queryByTestId("apply-teacher-button")).toBeNull();
  });

  it("ORG_OWNER là role tổ chức trong danh sách roles (đang ở vai học viên): không hiện nút", () => {
    authState = {
      roles: [
        role("sr-student", "STUDENT"),
        { id: "or-owner", type: "organization", role_name: "ORG_OWNER", display_name: "Chủ", organization_id: "org-1" },
      ],
      activeRole: "STUDENT",
    };
    render(<ApplyTeacherButton />);
    expect(screen.queryByTestId("apply-teacher-button")).toBeNull();
  });

  it("PARENT: vẫn hiện nút", () => {
    authState = { roles: [role("sr-parent", "PARENT")], activeRole: "PARENT" };
    render(<ApplyTeacherButton />);
    expect(screen.queryByTestId("apply-teacher-button")).not.toBeNull();
  });
});
