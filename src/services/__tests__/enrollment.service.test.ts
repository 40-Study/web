/**
 * Chốt contract `enrollmentService.getAll` vs backend thật.
 *
 * Phát hiện LIVE khi verify review PR #26 MAJOR #2 (2026-09-27): trang player
 * `(lesson)/learn/[courseSlug]/[lessonId]/page.tsx` gọi `useMyEnrollments()`
 * rồi `.find(...)` trên kết quả — crash `enrollments.find is not a function`
 * mỗi lần student mở bài học. Nguyên nhân: `GET /enrollments` (curl trực
 * tiếp backend dev, 2026-09-27) trả object phân trang
 * `{ enrollments: Enrollment[], total, page, page_size }`, KHÔNG PHẢI mảng
 * phẳng như type cũ `R<Enrollment[]>` đoán — service từng đọc thẳng
 * `r.data.data` (= object phân trang) coi như mảng.
 *
 * Cùng lớp lỗi certificate.service.test.ts đã chốt (contract ĐOÁN vs backend
 * thật) — TypeScript không bắt được vì service tự nhất quán nội bộ.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { enrollmentService } from "@/services/enrollment.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

const ENROLLMENT_1 = {
  id: "e1",
  course_id: "c1",
  user_id: "u1",
  progress_percentage: 65,
};
const ENROLLMENT_2 = {
  id: "e2",
  course_id: "c2",
  user_id: "u1",
  progress_percentage: 100,
};

beforeEach(() => {
  resetMockApi();
});

describe("enrollmentService.getAll — GET /enrollments trả object phân trang, không phải mảng phẳng", () => {
  it("unwrap đúng field `enrollments` bên trong object phân trang thành mảng", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        enrollments: [ENROLLMENT_1, ENROLLMENT_2],
        total: 2,
        page: 1,
        page_size: 20,
      })
    );

    const res = await enrollmentService.getAll();

    // Guard chính: phải là MẢNG dùng được .find()/.map() ngay, không phải
    // object phân trang còn nguyên `{enrollments, total, page, page_size}`.
    expect(Array.isArray(res)).toBe(true);
    expect(res).toHaveLength(2);
    expect(res.find((e) => e.course_id === "c1")?.progress_percentage).toBe(65);
    expect(res.find((e) => e.course_id === "c2")?.progress_percentage).toBe(100);
  });

  it("danh sách rỗng -> mảng rỗng, không throw", async () => {
    mockApi.get.mockResolvedValue(
      envelope({ enrollments: [], total: 0, page: 1, page_size: 20 })
    );

    const res = await enrollmentService.getAll();

    expect(res).toEqual([]);
  });

  it("gọi đúng endpoint GET /enrollments", async () => {
    mockApi.get.mockResolvedValue(
      envelope({ enrollments: [], total: 0, page: 1, page_size: 20 })
    );

    await enrollmentService.getAll();

    expect(mockApi.get).toHaveBeenCalledWith("/enrollments");
  });
});
