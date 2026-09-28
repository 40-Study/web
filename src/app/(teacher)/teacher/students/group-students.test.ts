import { describe, expect, it } from "vitest";
import type { TeacherStudent } from "@/services/teacher.service";
import { courseFilterOptions, groupStudents } from "./group-students";

const row = (over: Partial<TeacherStudent>): TeacherStudent => ({
  id: "s1",
  name: "QA Hoc Vien",
  email: "qa@40study.test",
  status: "active",
  enrolled_at: "2026-09-01T00:00:00Z",
  ...over,
});

describe("groupStudents (D6)", () => {
  it("học viên học 2 khoá -> 1 dòng, giữ cả 2 khoá", () => {
    const out = groupStudents([
      row({ course_id: "c1", course_name: "QA-Khoa A" }),
      row({ course_id: "c2", course_name: "QA-Khoa B", status: "graduated" }),
      row({ id: "s2", name: "QA Khac", course_id: "c1", course_name: "QA-Khoa A" }),
    ]);
    expect(out.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(out[0].courses.map((c) => c.courseName)).toEqual(["QA-Khoa A", "QA-Khoa B"]);
    expect(out[0].status).toBe("active");
    expect(courseFilterOptions(out)).toEqual(["QA-Khoa A", "QA-Khoa B"]);
  });

  it("dòng trùng hệt (cùng khoá, cùng lớp) không nhân đôi khoá", () => {
    const out = groupStudents([
      row({ course_id: "c1", course_name: "QA-Khoa A", class_name: "Lop 1" }),
      row({ course_id: "c1", course_name: "QA-Khoa A", class_name: "Lop 1" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].courses).toHaveLength(1);
  });

  it("trạng thái chung: mọi khoá hoàn thành -> graduated; không khoá nào đang học -> inactive", () => {
    expect(groupStudents([row({ course_id: "c1", course_name: "A", status: "graduated" })])[0].status).toBe("graduated");
    expect(
      groupStudents([
        row({ course_id: "c1", course_name: "A", status: "graduated" }),
        row({ course_id: "c2", course_name: "B", status: "inactive" }),
      ])[0].status
    ).toBe("inactive");
  });

  it("phụ huynh chỉ có ở dòng sau vẫn được giữ", () => {
    const out = groupStudents([
      row({ course_id: "c1", course_name: "A" }),
      row({ course_id: "c2", course_name: "B", parent_name: "QA Phu Huynh", parent_phone: "0900" }),
    ]);
    expect(out[0].parentName).toBe("QA Phu Huynh");
    expect(out[0].parentPhone).toBe("0900");
  });
});
