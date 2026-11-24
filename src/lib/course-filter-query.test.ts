import { describe, expect, it } from "vitest";
import { applyCourseFiltersToParams, courseFilterKey, parseCourseFilterParams } from "./course-filter-query";

describe("course-filter-query", () => {
  it("parse đọc category, levels, giá, sort", () => {
    const f = parseCourseFilterParams(new URLSearchParams("category=lap-trinh-web&levels=beginner,advanced&priceMin=100000&priceMax=500000&sort=newest"));
    expect(f).toEqual({ category: "lap-trinh-web", levels: ["beginner", "advanced"], priceMin: 100000, priceMax: 500000, sortBy: "newest" });
  });

  it("giá trị rác bị bỏ qua", () => {
    expect(parseCourseFilterParams(new URLSearchParams("sort=hack&priceMin=-5&priceMax=abc&levels=,"))).toEqual({});
  });

  it("apply giữ nguyên khoá khác (q) và xoá khoá bộ lọc rỗng", () => {
    const base = new URLSearchParams("q=python&category=cu&sort=newest");
    const next = applyCourseFiltersToParams(base, { category: "moi" });
    expect(next.get("q")).toBe("python");
    expect(next.get("category")).toBe("moi");
    expect(next.has("sort")).toBe(false);
    expect(base.get("category")).toBe("cu");
  });

  it("round-trip qua URL cho cùng một bộ lọc", () => {
    const filters = { category: "thiet-ke", levels: ["beginner"], priceMax: 300000, sortBy: "rating" as const };
    expect(parseCourseFilterParams(applyCourseFiltersToParams(new URLSearchParams(), filters))).toEqual(filters);
    expect(courseFilterKey(filters)).toBe(courseFilterKey(parseCourseFilterParams(applyCourseFiltersToParams(new URLSearchParams(), filters))));
  });
});
