/** Q3-21: thẻ mobile phải có trạng thái (không xuống dòng) và liên kết hồ sơ mà bảng 6 cột làm bị cắt ở 390px. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudentMobileCard } from "./student-mobile-card";
import type { GroupedStudent } from "./group-students";

const student: GroupedStudent = {
  id: "s1",
  name: "Hoc Vien Mot",
  studentId: "HS001",
  parentName: "Phu Huynh",
  parentPhone: "0900000000",
  status: "active",
  courses: [{ courseId: "c1", courseName: "Khoa A", className: "Lop A", status: "active" }],
};

describe("StudentMobileCard", () => {
  it("hiện trạng thái, khoá học, phụ huynh và liên kết Hồ sơ", () => {
    render(
      <ul>
        <StudentMobileCard student={student} />
      </ul>
    );
    expect(screen.getByText("ĐANG HỌC").className).toContain("whitespace-nowrap");
    expect(screen.getByText(/Khoa A/)).toBeTruthy();
    expect(screen.getByText("PH: Phu Huynh").getAttribute("href")).toBe("tel:0900000000");
    expect(screen.getByRole("link", { name: "Hồ sơ" }).getAttribute("href")).toBe("/teacher/students/s1");
  });

  it("Q4-T21: phụ huynh không có số điện thoại thì không phải link", () => {
    render(
      <ul>
        <StudentMobileCard student={{ ...student, parentPhone: undefined }} />
      </ul>
    );
    const parent = screen.getByText("PH: Phu Huynh");
    expect(parent.tagName).toBe("SPAN");
    expect(screen.queryByRole("link", { name: /Phu Huynh/ })).toBeNull();
  });

  it("Q4-T11: không còn ô chọn học viên (chỉ phục vụ nút gửi thông báo đã gỡ)", () => {
    render(
      <ul>
        <StudentMobileCard student={student} />
      </ul>
    );
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});
