import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

import { RoleGuard } from "./role-guard";

// UX-B-01: mở thẳng /teacher/* hay /parent/children/:id từng trắng trơn 4–9s vì guard trả null cả lúc
// đang kiểm phiên. Nay vẽ khung trang + skeleton do layout truyền vào.
describe("RoleGuard lúc đang kiểm phiên", () => {
  beforeEach(() => {
    replace.mockReset();
    useAuthStore.getState().clearServerSession();
    useAuthStore.setState({ hasHydrated: true, sessionStatus: "checking", isAuthenticated: false, activeRole: "TEACHER" });
  });

  it("vẽ pendingFallback (khung + skeleton), chưa vẽ nội dung bảo vệ, không điều hướng", () => {
    render(
      <RoleGuard roles={["TEACHER"]} pendingFallback={<p>khung giảng viên</p>}>
        <p>nội dung bảo vệ</p>
      </RoleGuard>
    );
    expect(screen.getByText("khung giảng viên")).toBeTruthy();
    expect(screen.queryByText("nội dung bảo vệ")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("không truyền pendingFallback: hiện màn tải chung thay vì trắng", () => {
    render(
      <RoleGuard roles={["TEACHER"]}>
        <p>nội dung bảo vệ</p>
      </RoleGuard>
    );
    expect(screen.getByText("Đang tải...")).toBeTruthy();
  });

  it("vai cache không được vào khu này (phụ huynh mở /teacher): không vẽ khung giảng viên", () => {
    useAuthStore.setState({ activeRole: "PARENT" });
    render(
      <RoleGuard roles={["TEACHER"]} pendingFallback={<p>khung giảng viên</p>}>
        <p>nội dung bảo vệ</p>
      </RoleGuard>
    );
    expect(screen.queryByText("khung giảng viên")).toBeNull();
    expect(screen.getByText("Đang tải...")).toBeTruthy();
  });

  it("phiên đã kết luận khách: không vẽ khung, chuyển về đăng nhập", () => {
    useAuthStore.setState({ sessionStatus: "anonymous" });
    const { container } = render(
      <RoleGuard roles={["TEACHER"]} pendingFallback={<p>khung giảng viên</p>}>
        <p>nội dung bảo vệ</p>
      </RoleGuard>
    );
    expect(container.textContent).toBe("");
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
