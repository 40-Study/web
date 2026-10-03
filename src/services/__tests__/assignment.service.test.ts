/**
 * R4: GET /classes/:classId/assignments (bài tập theo lớp, dùng cho khu quản lý tổ chức và trang lớp).
 * Envelope giống GET /assignments?session_id= (raw {data,total,page,page_size}, không bọc thêm {message,data}).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { assignmentService } from "@/services/assignment.service";
import { mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => resetMockApi());

describe("assignmentService.getByClass", () => {
  it("gọi đúng đường dẫn theo lớp với phân trang và trả nguyên danh sách", async () => {
    const list = { data: [{ id: "a1" }], total: 1, page: 1, page_size: 50 };
    mockApi.get.mockResolvedValue({ data: list });

    const result = await assignmentService.getByClass("class-1");

    expect(mockApi.get).toHaveBeenCalledWith("/classes/class-1/assignments", { params: { page: 1, page_size: 50 } });
    expect(result).toEqual(list);
  });

  it("truyền trang và cỡ trang tuỳ chọn", async () => {
    mockApi.get.mockResolvedValue({ data: { data: [], total: 0, page: 2, page_size: 10 } });
    await assignmentService.getByClass("class-1", 2, 10);
    expect(mockApi.get).toHaveBeenCalledWith("/classes/class-1/assignments", { params: { page: 2, page_size: 10 } });
  });
});
