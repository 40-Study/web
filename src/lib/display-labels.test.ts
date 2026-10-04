import { describe, expect, it } from "vitest";
import { assignmentTypeLabel, difficultyLabel, gradeTypeLabel, roomLabel } from "./display-labels";

describe("display-labels", () => {
  it("loại điểm: mọi mã của backend đều có nhãn Việt, mã lạ về Khác (không in mã thô)", () => {
    expect(
      ["assignment", "quiz", "midterm", "final", "attendance", "participation", "project", "other"].map(gradeTypeLabel),
    ).toEqual(["Bài tập", "Kiểm tra nhanh", "Giữa kỳ", "Cuối kỳ", "Chuyên cần", "Tham gia", "Dự án", "Khác"]);
    expect(gradeTypeLabel("zzz")).toBe("Khác");
  });
  it("loại bài tập và độ khó", () => {
    expect(assignmentTypeLabel("homework")).toBe("Bài về nhà");
    expect(assignmentTypeLabel("lạ")).toBeNull();
    expect(difficultyLabel("hard")).toBe("Khó");
    expect(difficultyLabel(undefined)).toBeNull();
  });
  it("tên phòng: không lặp chữ Phòng", () => {
    expect(roomLabel("Phòng 301")).toBe("Phòng 301");
    expect(roomLabel("301")).toBe("Phòng 301");
  });
});