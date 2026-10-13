/**
 * QA2 PG-M2 / G2: tên giảng viên trên trang khoá học là chữ thường, không dẫn tới đâu.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InstructorCard } from "./instructor-card";

describe("InstructorCard — liên kết tới hồ sơ công khai", () => {
  it("tên giảng viên là link tới /teachers/:id", () => {
    render(<InstructorCard instructor={{ id: "teacher-1", name: "Trần Thị Giảng Viên" }} />);
    const link = screen.getByRole("link", { name: "Trần Thị Giảng Viên" });
    expect(link.getAttribute("href")).toBe("/teachers/teacher-1");
  });

  it.each([
    ["thiếu id", { id: "", name: "Trần Thị Giảng Viên" }],
    ["tên chưa cập nhật (placeholder)", { id: "teacher-1", name: "Chưa cập nhật" }],
    ["tên 'Unknown'", { id: "teacher-1", name: "Unknown" }],
  ])("%s: không tạo link chết", (_label, instructor) => {
    render(<InstructorCard instructor={instructor} />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
