import { describe, expect, it } from "vitest";
import { contactsFromChildren, contactsFromEnrolled, contactsState } from "./teacher-contacts";

describe("contactsFromEnrolled (E1 — học sinh)", () => {
  it("liệt kê giảng viên khi enrollment có instructor, gộp trùng theo id", () => {
    const r = contactsFromEnrolled([
      { title: "React", instructor: { id: "t1", name: "Nguyễn Văn A" } },
      { title: "Git", instructor: { id: "t1", name: "Nguyễn Văn A" } },
      { title: "Flutter", instructor: { id: "t2", name: "Trần B", avatar: "a.png" } },
    ]);
    expect(contactsState(r)).toBe("ready");
    expect(r.contacts).toEqual([
      { id: "t1", name: "Nguyễn Văn A", avatar: undefined, contexts: ["React", "Git"] },
      { id: "t2", name: "Trần B", avatar: "a.png", contexts: ["Flutter"] },
    ]);
  });

  it("có khoá nhưng thiếu id giảng viên thì KHÔNG báo 'chưa đăng ký khoá học' (N12)", () => {
    const r = contactsFromEnrolled([{ title: "React", instructor: { id: "", name: "Chưa cập nhật" } }]);
    expect(contactsState(r)).toBe("missing-instructor");
  });

  it("chưa có khoá nào thì mới là no-courses", () => {
    expect(contactsState(contactsFromEnrolled([]))).toBe("no-courses");
  });
});

describe("contactsFromChildren (E2 — phụ huynh)", () => {
  it("lấy giảng viên từ khoá của các con, kèm tên con", () => {
    const r = contactsFromChildren([
      {
        childName: "Lê Văn C",
        courses: [
          { course_name: "React", instructor_id: "t1", instructor_name: "Nguyễn Văn A" },
          { course_name: "Khoá mồ côi", instructor_name: "" },
        ],
      },
    ]);
    expect(contactsState(r)).toBe("ready");
    expect(r.totalCourses).toBe(2);
    expect(r.contacts).toEqual([
      { id: "t1", name: "Nguyễn Văn A", avatar: undefined, contexts: ["React (con: Lê Văn C)"] },
    ]);
  });

  it("backend cũ không có instructor_id: báo thiếu dữ liệu giảng viên, không phải chưa có khoá", () => {
    const r = contactsFromChildren([
      { childName: "C", courses: [{ course_name: "React", instructor_name: "Nguyễn Văn A" }] },
    ]);
    expect(contactsState(r)).toBe("missing-instructor");
  });
});
