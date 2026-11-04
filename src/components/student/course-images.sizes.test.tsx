/**
 * QA3 Q21: next/image cảnh báo ở /my-courses — hero khai `sizes="100vw"` dù nằm ở cột chính, và ảnh LCP thiếu `priority`.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EnrolledCourse } from "@/types/course";

const imageProps: Array<Record<string, unknown>> = [];
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    imageProps.push(props);
    return null;
  },
}));
vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

import { CurrentCourseHero } from "./current-course-hero";
import { EnrolledCourseCard } from "./enrolled-course-card";

const course = {
  slug: "x", title: "Khoá X", thumbnail: "https://cdn.test/x.png", progress: 10, completedLessons: 1, totalLessons: 10,
} as EnrolledCourse;

describe("ảnh khoá học ở /my-courses (Q21)", () => {
  it("hero: không khai 100vw (không phủ viewport) và có priority vì là ảnh LCP", () => {
    imageProps.length = 0;
    render(<CurrentCourseHero course={course} />);
    expect(imageProps[0].sizes).not.toBe("100vw");
    expect(String(imageProps[0].sizes)).toContain("66vw");
    expect(imageProps[0].priority).toBe(true);
  });

  it("thẻ khoá học: priority mặc định tắt, bật khi là ảnh đầu trang; luôn có sizes", () => {
    imageProps.length = 0;
    render(<EnrolledCourseCard course={course} />);
    render(<EnrolledCourseCard course={course} priority />);
    expect(imageProps[0].priority).toBe(false);
    expect(imageProps[1].priority).toBe(true);
    expect(imageProps.every((p) => typeof p.sizes === "string" && p.sizes.length > 0)).toBe(true);
  });
});
