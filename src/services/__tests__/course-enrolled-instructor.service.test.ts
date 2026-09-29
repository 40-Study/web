import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { courseService } from "@/services/course.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

describe("courseService.getEnrolledCourses — giữ giảng viên (E1/N12)", () => {
  beforeEach(() => resetMockApi());

  it("chép instructor_id và instructor từ enrollment sang ApiCourse", async () => {
    mockApi.get.mockResolvedValueOnce(
      envelope({
        total: 1,
        enrollments: [
          {
            id: "e1",
            user_id: "u1",
            course_id: "c1",
            course_title: "React",
            course_slug: "react",
            progress_percentage: "55.56",
            enrolled_at: "2026-09-01T10:00:00+07:00",
            total_lessons: 9,
            completed_lessons: 5,
            instructor_id: "t1",
            instructor: { id: "t1", name: "Nguyễn Văn A", avatar: "a.png" },
          },
        ],
      })
    );

    const [course] = await courseService.getEnrolledCourses();
    expect(course.instructor_id).toBe("t1");
    expect(course.instructor).toEqual({ id: "t1", name: "Nguyễn Văn A", avatar: "a.png" });
  });
});
