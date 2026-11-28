/**
 * Q11-ADMIN-03: `status=self_deleted` đi thẳng lên backend; chỉ khi backend CŨ từ chối 400 mới hỏi lại bằng `locked`.
 * Mọi lỗi khác (500, 403...) và mọi status khác không được nuốt thành fallback.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { userService } from "./user.service";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

const page = (total: number) => envelope({ items: [], total_count: total, page: 1, limit: 20, total_pages: 1 });
const statusesSent = () => mockApi.get.mock.calls.map(([, cfg]) => (cfg as { params: { status?: string } }).params.status);

beforeEach(() => {
  resetMockApi();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("userService.list — status=self_deleted (Q11-ADMIN-03)", () => {
  it("backend mới: một request với status=self_deleted, không fallback", async () => {
    mockApi.get.mockResolvedValue(page(7));
    const res = await userService.list({ status: "self_deleted", page: 1, limit: 20 });
    expect(res.total_count).toBe(7);
    expect(res.client_split).toBeUndefined();
    expect(statusesSent()).toEqual(["self_deleted"]);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("backend cũ (400 Invalid query params): hỏi lại bằng locked, có cảnh báo", async () => {
    mockApi.get
      .mockRejectedValueOnce(new ApiError(400, "UNKNOWN", "Invalid query params"))
      .mockResolvedValueOnce(page(10));
    const res = await userService.list({ status: "self_deleted", page: 1, limit: 20 });
    expect(res.total_count).toBe(10);
    expect(res.client_split).toBe(true);
    expect(statusesSent()).toEqual(["self_deleted", "locked"]);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("lỗi khác 400 (500) ném nguyên, không fallback", async () => {
    mockApi.get.mockRejectedValue(new ApiError(500, "UNKNOWN", "boom"));
    await expect(userService.list({ status: "self_deleted" })).rejects.toMatchObject({ status: 500 });
    expect(statusesSent()).toEqual(["self_deleted"]);
  });

  it("400 của status khác (locked) ném nguyên, không fallback", async () => {
    mockApi.get.mockRejectedValue(new ApiError(400, "UNKNOWN", "Invalid query params"));
    await expect(userService.list({ status: "locked" })).rejects.toMatchObject({ status: 400 });
    expect(statusesSent()).toEqual(["locked"]);
  });
});
