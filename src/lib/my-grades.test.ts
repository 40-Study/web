import { describe, expect, it } from "vitest";
import type { Grade } from "@/services/grade.service";
import { groupGradesByClass, scoreTone } from "./my-grades";

function g(over: Partial<Grade>): Grade {
  return {
    id: "g",
    class_id: "c1",
    class_name: "Lớp ReactJS K12",
    student_id: "u1",
    grade_type: "assignment",
    title: "Bài tập",
    score: 9,
    max_score: 10,
    graded_at: "2026-09-22T23:59:00+07:00",
    ...over,
  };
}

describe("groupGradesByClass", () => {
  it("nhóm theo lớp, điểm mới chấm xếp trước, lớp có điểm mới nhất xếp trước", () => {
    const groups = groupGradesByClass([
      g({ id: "a", class_id: "c1", graded_at: "2026-09-01T00:00:00Z" }),
      g({ id: "b", class_id: "c2", class_name: "Lớp Python", graded_at: "2026-09-30T00:00:00Z" }),
      g({ id: "c", class_id: "c1", graded_at: "2026-09-10T00:00:00Z" }),
    ]);
    expect(groups.map((x) => x.classId)).toEqual(["c2", "c1"]);
    expect(groups[1].grades.map((x) => x.id)).toEqual(["c", "a"]);
    expect(groups[0].className).toBe("Lớp Python");
  });

  it("thiếu tên lớp thì dùng nhãn chung, có dòng sau mang tên thì lấy tên thật", () => {
    const groups = groupGradesByClass([
      g({ id: "a", class_name: undefined }),
      g({ id: "b", class_name: "Lớp ReactJS K12" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].className).toBe("Lớp ReactJS K12");
    expect(groupGradesByClass([g({ class_name: undefined })])[0].className).toBe("Lớp học");
  });

  it("danh sách rỗng cho ra nhóm rỗng", () => {
    expect(groupGradesByClass([])).toEqual([]);
  });
});

describe("scoreTone", () => {
  it("theo tỉ lệ trên thang của bản ghi", () => {
    expect(scoreTone(8, 10)).toBe("good");
    expect(scoreTone(5, 10)).toBe("ok");
    expect(scoreTone(4.9, 10)).toBe("low");
    expect(scoreTone(80, 100)).toBe("good");
  });

  it("thang không hợp lệ không chia cho 0", () => {
    expect(scoreTone(5, 0)).toBe("low");
  });
});
