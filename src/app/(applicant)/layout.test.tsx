/**
 * Layout ứng viên (Phase 3) — lối ra khỏi khu ứng viên. (app)/layout không nhận TEACHER_APPLICANT,
 * nên user còn vai trò khác (vd STUDENT) phải có nút quay lại vai trò đó qua switch-role; thiếu nút
 * thì cách duy nhất là đăng xuất.
 *
 * Mock RoleGuard (passthrough) và hook auth để cô lập logic hiển thị/gọi switch-role.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSwitch = vi.fn();
const mockLogout = vi.fn();

vi.mock("@/components/guards/role-guard", () => ({
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/queries/use-auth", () => ({
  useSwitchRole: () => ({ mutate: mockSwitch, isPending: false }),
  useLogout: () => ({ mutate: mockLogout, isPending: false }),
}));

type Role = {
  id: string;
  type: "system" | "organization";
  role_name: string;
  display_name: string;
  organization_id?: string;
};
let authState: { user: { name: string } | null; roles: Role[]; activeRole: string | null } = {
  user: null,
  roles: [],
  activeRole: null,
};
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// eslint-disable-next-line import/first
import ApplicantLayout from "./layout";

const role = (id: string, name: string): Role => ({ id, type: "system", role_name: name, display_name: name });

function renderLayout() {
  return render(
    <ApplicantLayout>
      <div data-testid="child">CHILD</div>
    </ApplicantLayout>
  );
}

describe("(applicant)/layout — lối quay lại vai trò khác", () => {
  beforeEach(() => {
    mockSwitch.mockReset();
    mockLogout.mockReset();
  });

  it("có STUDENT: hiện nút 'Quay lại vai trò học viên' và switch-role đúng role_id", () => {
    authState = {
      user: { name: "An" },
      roles: [role("sr-student", "STUDENT"), role("sr-applicant", "TEACHER_APPLICANT")],
      activeRole: "TEACHER_APPLICANT",
    };
    renderLayout();

    const btn = screen.getByTestId("applicant-switch-back");
    expect(btn.textContent).toContain("Quay lại vai trò học viên");

    fireEvent.click(btn);
    expect(mockSwitch).toHaveBeenCalledTimes(1);
    expect(mockSwitch).toHaveBeenCalledWith({
      role_id: "sr-student",
      role_type: "system",
      organization_id: undefined,
    });
  });

  it("chỉ có TEACHER_APPLICANT: không hiện nút quay lại", () => {
    authState = {
      user: { name: "An" },
      roles: [role("sr-applicant", "TEACHER_APPLICANT")],
      activeRole: "TEACHER_APPLICANT",
    };
    renderLayout();
    expect(screen.queryByTestId("applicant-switch-back")).toBeNull();
    expect(screen.queryByTestId("child")).not.toBeNull();
  });
});
