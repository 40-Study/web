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
      },
    ]);
  });
});

describe("listMine (Q2-06)", () => {
  it("GET /classes/me và unwrap `data.classes` (khớp GetMyClasses của backend)", async () => {
    mockApi.get.mockResolvedValue(
      envelope({ classes: [{ id: "c1", name: "Lớp A", status: "active", student_count: 3, teacher_count: 1 }] }),
    );

    const classes = await classService.listMine();

    expect(mockApi.get).toHaveBeenCalledWith("/classes/me");
    expect(classes).toEqual([{ id: "c1", name: "Lớp A", status: "active", student_count: 3, teacher_count: 1 }]);
  });

  it("backend trả classes null (giảng viên chưa có lớp) -> mảng rỗng, không ném", async () => {
    mockApi.get.mockResolvedValue(envelope({ classes: null }));
    expect(await classService.listMine()).toEqual([]);
  });
});
