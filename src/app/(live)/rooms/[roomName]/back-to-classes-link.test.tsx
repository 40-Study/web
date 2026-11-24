import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import { BackToClassesLink } from "./back-to-classes-link";

afterEach(() => useAuthStore.setState({ activeRole: null, roles: [] }));

describe("BackToClassesLink (Round 2)", () => {
  it("giảng viên bị mời ra / không vào được phòng: về khoá học giảng dạy, không phải /my-courses", () => {
    useAuthStore.setState({ activeRole: "TEACHER" });
    render(<BackToClassesLink />);
    expect(screen.getByRole("link", { name: /Quay lại danh sách lớp học/ }).getAttribute("href")).toBe("/teacher/courses");
  });

  it("học viên: giữ /my-courses", () => {
    useAuthStore.setState({ activeRole: "STUDENT" });
    render(<BackToClassesLink />);
    expect(screen.getByRole("link", { name: /Quay lại danh sách lớp học/ }).getAttribute("href")).toBe("/my-courses");
  });
});
