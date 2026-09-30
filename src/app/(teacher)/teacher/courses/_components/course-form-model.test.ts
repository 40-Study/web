import { describe, expect, it } from "vitest";
import type { ApiCourse } from "@/services/course.service";
import { buildCourseUpdatePayload, courseToFormData } from "./course-form-model";

const course = (over: Partial<ApiCourse> = {}): ApiCourse =>
  ({
    id: "c1",
    title: "QA-Khoa sua",
    short_description: "QA mo ta ngan",
    description: "QA mo ta dai",
    level: "all_levels",
    language: "vi",
    is_free: false,
    price: "1200000.00",
    objectives: ["Muc tieu 1"],
    ...over,
  }) as unknown as ApiCourse;

describe("course-form-model (D1: trang /edit sửa được thông tin khoá)", () => {
  it("điền sẵn form từ khoá hiện có: giá decimal -> số, all_levels -> all, danh sách rỗng -> 1 ô trống", () => {
    const f = courseToFormData(course({ requirements: [] }));
    expect(f.title).toBe("QA-Khoa sua");
    expect(f.price).toBe("1200000");
    expect(f.level).toBe("all");
    expect(f.objectives).toEqual(["Muc tieu 1"]);
    expect(f.requirements).toEqual([""]);
  });

  it("xoá trắng mô tả thì payload GỬI chuỗi rỗng (không bỏ field), level all -> all_levels", () => {
    const original = course();
    const f = { ...courseToFormData(original), description: "", short_description: "" };
    const { payload, error } = buildCourseUpdatePayload(f, original);
    expect(error).toBeUndefined();
    expect(payload).toHaveProperty("description", "");
    expect(payload).toHaveProperty("short_description", "");
    expect(payload?.level).toBe("all_levels");
    expect(payload?.price).toBe(1200000);
  });

  it("xoá trắng giá khuyến mãi đang có -> payload GỬI discount_price null (backend xoá), không gửi hạn", () => {
    const original = course({ discount_price: "900000", discount_expires_at: "2026-12-01T00:00:00Z" } as Partial<ApiCourse>);
    const f = { ...courseToFormData(original), discount_price: "" };
    const res = buildCourseUpdatePayload(f, original);
    expect(res.error).toBeUndefined();
    expect(res.payload).toHaveProperty("discount_price", null);
    expect(res.payload).not.toHaveProperty("discount_expires_at");
  });

  it("khoá vốn không có khuyến mãi và ô để trống -> không gửi discount_price (giữ nguyên)", () => {
    const original = course();
    const res = buildCourseUpdatePayload({ ...courseToFormData(original), discount_price: "" }, original);
    expect(res.error).toBeUndefined();
    expect(res.payload).not.toHaveProperty("discount_price");
  });

  it("giá khuyến mãi >= giá bán hoặc giá bán trống bị từ chối", () => {
    const original = course();
    expect(buildCourseUpdatePayload({ ...courseToFormData(original), discount_price: "1200000" }, original).error).toBeTruthy();
    expect(buildCourseUpdatePayload({ ...courseToFormData(original), price: "" }, original).error).toBeTruthy();
  });
});
