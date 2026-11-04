import { describe, expect, it } from "vitest";
import type { TeacherStudent } from "@/services/teacher.service";
import { buildStudentProfile } from "./student-profile-aggregate";

const row = (over: Partial<TeacherStudent>): TeacherStudent => ({
  id: "s1",
  name: "Hoc Vien Mot",
  status: "active",
  enrolled_at: "2026-09-01T00:00:00Z",
  ...over,
});

describe("buildStudentProfile (Q3-07)", () => {
  it("gom mọi khoá/lớp của học viên, không chỉ dòng đầu tiên", () => {
    const profile = buildStudentProfile(
      [
        row({ course_id: "c1", course_name: "Khoa A", class_id: "k1", class_name: "Lop A", status: "graduated" }),
        row({ course_id: "c2", course_name: "Khoa B", class_id: "k2", class_name: "Lop B" }),
      ],
      "s1"
    );
    expect(profile?.courses.map((c) => c.courseName)).toEqual(["Khoa A", "Khoa B"]);
    expect(profile?.courses.map((c) => c.className)).toEqual(["Lop A", "Lop B"]);
    // dòng đầu đã hoàn thành nhưng dòng sau còn học -> đang học
    expect(profile?.status).toBe("active");
  });

  it("bạn cùng lớp là hợp các lớp của học viên, loại chính học viên và loại trùng", () => {
    const profile = buildStudentProfile(
      [
        row({ course_id: "c1", class_id: "k1" }),
        row({ course_id: "c2", class_id: "k2" }),
        row({ id: "s2", name: "Ban Hai", class_id: "k1" }),
        row({ id: "s3", name: "Ban Ba", class_id: "k2" }),
        row({ id: "s2", name: "Ban Hai", class_id: "k2" }),
        row({ id: "s4", name: "Lop Khac", class_id: "k9" }),
      ],
      "s1"
    );
    expect(profile?.classmates.map((m) => m.id).sort()).toEqual(["s2", "s3"]);
  });

  it("học viên chưa có lớp không bị gộp với học viên khác cũng chưa có lớp", () => {
    const profile = buildStudentProfile(
      [row({ course_id: "c1" }), row({ id: "s2", name: "Khac", course_id: "c1" })],
      "s1"
    );
    expect(profile?.classmates).toEqual([]);
  });

  it("trả null khi không có dòng nào của học viên", () => {
    expect(buildStudentProfile([row({ id: "s2" })], "s1")).toBeNull();
  });
});
