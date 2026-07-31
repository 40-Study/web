import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { classService } from "@/services/class.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => {
  resetMockApi();
});

describe("getStudentsByClassId", () => {
  it("unwrap roster và chuẩn hóa tên theo StudentClassListResponseDTO", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        students: [
          {
            id: "sc1",
            student_id: "u1",
            class_id: "c1",
            user_name: "student01",
            full_name: "Nguyễn Văn A",
            email: "student@example.com",
            enrolled_at: "2026-07-31T00:00:00Z",
            status: "active",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      })
    );

    const students = await classService.getStudentsByClassId("c1");

    expect(students).toEqual([
      {
        student_id: "u1",
        name: "Nguyễn Văn A",
        email: "student@example.com",
      },
    ]);
  });
});
