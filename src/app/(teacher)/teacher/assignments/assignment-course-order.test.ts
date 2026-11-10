import { describe, expect, it } from "vitest";
import type { ApiCourse } from "@/services/course.service";
import { orderAssignmentCourses } from "./assignment-course-order";

const c = (id: string, status: string, updated: string): ApiCourse =>
  ({ id, title: id, status, updated_at: updated }) as ApiCourse;

describe("orderAssignmentCourses (QA-B-08)", () => {
  it("chọn sẵn khoá đã xuất bản gần nhất, không phải khoá bị từ chối đứng đầu API", () => {
    const result = orderAssignmentCourses([
      c("bi-tu-choi", "rejected", "2026-11-01T00:00:00Z"),
      c("nhap", "draft", "2026-11-05T00:00:00Z"),
      c("react", "published", "2026-10-01T00:00:00Z"),
      c("flutter", "published", "2026-10-20T00:00:00Z"),
    ]);
    expect(result.defaultId).toBe("flutter");
    expect(result.published.map((x) => x.id)).toEqual(["flutter", "react"]);
    expect(result.others.map((x) => x.id)).toEqual(["nhap", "bi-tu-choi"]);
  });

  it("không có khoá xuất bản: chọn khoá đầu của nhóm còn lại", () => {
    expect(orderAssignmentCourses([c("nhap", "draft", "2026-11-05T00:00:00Z")]).defaultId).toBe("nhap");
  });

  it("không có khoá nào: defaultId rỗng", () => {
    expect(orderAssignmentCourses([]).defaultId).toBe("");
  });
});
