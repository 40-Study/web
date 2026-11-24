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

// Q6-T08: id học viên không tồn tại phải ra "Không tìm thấy học viên" TRONG khung giảng viên (như khoá/lớp/cuộc thi),
// không ném notFound() ra trang 404 toàn cục không có thanh bên.
describe("/teacher/students/[id] — học viên không tồn tại (Q6-T08)", () => {
  beforeEach(() => {
    rows = [];
  });

  it("id lạ: thẻ 'Không tìm thấy học viên' kèm link về Quản lý học viên, KHÔNG ném notFound()", () => {
    rows = [row({ id: "other" })];
    expect(() => render(<TeacherStudentProfilePage />)).not.toThrow();
    expect(screen.getByText("Không tìm thấy học viên")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Về Quản lý học viên" }).getAttribute("href")).toBe("/teacher/students");
    expect(screen.queryByText("Hồ sơ học viên")).toBeNull();
  });
});
