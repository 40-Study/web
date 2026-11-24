/**
 * Q5-T06: "Chưa cập nhật" (học viên không có SĐT phụ huynh) là thẻ <a> không href tô xanh + gạch chân như liên kết;
 * khoá chưa xếp lớp có tiêu đề "Chưa có lớp" to hơn cả tên khoá.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let rows: Record<string, unknown>[] = [];
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "st1" }),
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("@/hooks/queries/use-classes", () => ({ useMyStudents: () => ({ data: rows, isLoading: false }) }));

// eslint-disable-next-line import/first
import TeacherStudentProfilePage from "./page";

const row = (extra: Record<string, unknown>) => ({
  id: "st1", name: "Học Viên Một", student_id: "HV001", status: "active", course_id: "c1", course_name: "Git & GitHub", ...extra,
});

describe("/teacher/students/[id] — SĐT phụ huynh và khoá chưa có lớp (Q5-T06)", () => {
  beforeEach(() => {
    rows = [];
  });

  it("có SĐT: là liên kết tel:", () => {
    rows = [row({ parent_phone: "0901234567", class_id: "k1", class_name: "Lớp A" })];
    render(<TeacherStudentProfilePage />);

    const link = screen.getByRole("link", { name: /0901234567/ });
    expect(link.getAttribute("href")).toBe("tel:0901234567");
  });

  it("không có SĐT: chữ thường 'Chưa cập nhật', KHÔNG phải <a> (không có link giả)", () => {
    rows = [row({ class_id: "k1", class_name: "Lớp A" })];
    render(<TeacherStudentProfilePage />);

    const text = screen.getByText("Chưa cập nhật");
    expect(text.closest("a")).toBeNull();
    expect(screen.queryByRole("link", { name: /Chưa cập nhật/ })).toBeNull();
  });

  it("khoá chưa có lớp: tên khoá là tiêu đề, 'Chưa có lớp' là chú thích nhỏ bên dưới", () => {
    rows = [row({})];
    render(<TeacherStudentProfilePage />);

    const course = screen.getByText("Git & GitHub");
    const note = screen.getByText("Chưa có lớp");
    expect(course.className).toContain("font-medium");
    expect(note.className).toContain("text-muted-foreground");
    expect(note.className).not.toContain("font-medium");
  });

  it("khoá có lớp: tên lớp là tiêu đề, tên khoá là chú thích (như cũ)", () => {
    rows = [row({ class_id: "k1", class_name: "Lớp A" })];
    render(<TeacherStudentProfilePage />);

    expect(screen.getByText("Lớp A").className).toContain("font-medium");
    expect(screen.getByText("Git & GitHub").className).toContain("text-muted-foreground");
  });
});
