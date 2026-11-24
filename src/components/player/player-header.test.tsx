/** A8 (QA vòng 2, N8): avatar player lấy từ người dùng đăng nhập, không ghi cứng "TK". */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlayerHeader } from "./player-header";
import { useAuthStore } from "@/stores/auth.store";

describe("PlayerHeader", () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, activeRole: null, roles: [] });
  });

  it("hiện chữ tắt của người đang học thay vì 'TK'", () => {
    useAuthStore.setState({ user: { id: "u1", email: "student1@demo.com", name: "Lê Văn C" } });
    render(<PlayerHeader courseSlug="git" />);
    expect(screen.queryByText("TK")).toBeNull();
    expect(screen.getByText("Lê")).toBeTruthy();
  });

  it("avatar dẫn tới trang hồ sơ có thật /profile/<id>, không phải /profile (404)", () => {
    useAuthStore.setState({ user: { id: "u1", email: "student1@demo.com", name: "Lê Văn C" } });
    render(<PlayerHeader courseSlug="git" />);
    expect(screen.getByRole("link", { name: "Trang cá nhân" }).getAttribute("href")).toBe("/profile/u1");
  });

  // Q5-T15 (L2): /my-courses là trang của học viên; giảng viên bấm vào sẽ bị guard đá lại kèm toast cảnh báo.
  it("giảng viên: 'Khoá học của tôi' trỏ /teacher/courses; học viên vẫn /my-courses", () => {
    useAuthStore.setState({ activeRole: "TEACHER" });
    const { unmount } = render(<PlayerHeader courseSlug="git" />);
    expect(screen.getByRole("link", { name: "Khoá học của tôi" }).getAttribute("href")).toBe("/teacher/courses");
    unmount();

    useAuthStore.setState({ activeRole: "STUDENT" });
    render(<PlayerHeader courseSlug="git" />);
    expect(screen.getByRole("link", { name: "Khoá học của tôi" }).getAttribute("href")).toBe("/my-courses");
  });

  it("vai tuỳ biến của tổ chức (QA3_TEACHER) quy về giảng viên theo vai hệ thống đang sở hữu", () => {
    useAuthStore.setState({
      activeRole: "QA3_TEACHER",
      roles: [
        { id: "sr-t", type: "system", role_name: "TEACHER", display_name: "TEACHER" },
        { id: "or-q", type: "organization", role_name: "QA3_TEACHER", display_name: "QA3_TEACHER" },
      ],
    });
    render(<PlayerHeader courseSlug="git" />);
    expect(screen.getByRole("link", { name: "Khoá học của tôi" }).getAttribute("href")).toBe("/teacher/courses");
  });
});
