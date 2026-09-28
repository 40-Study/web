/**
 * A-P1-4 regression — /admin/permissions và dashboard hiển thị 20/23 quyền (backend mặc định
 * page_size=20). Root cause: permissionService.getAll() gọi GET /permissions không kèm page_size
 * nên rơi vào default của backend. Test này ĐỎ nếu ai đó bỏ tham số page_size đi.
 */

import { beforeEach, describe, expect, it } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { vi } from "vitest";
import { permissionService } from "@/services/permission.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => {
  resetMockApi();
});

describe("permissionService.getAll", () => {
  it("xin đủ page_size=100 để không bị cắt còn 20/tổng 23 như bug cũ", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        permissions: Array.from({ length: 23 }, (_, i) => ({ id: `p${i}`, name: `PERM_${i}` })),
        total: 23,
      })
    );

    const result = await permissionService.getAll();

    expect(mockApi.get).toHaveBeenCalledWith(
      "/permissions",
      expect.objectContaining({ params: expect.objectContaining({ page_size: expect.any(Number) }) })
    );
    const [, config] = mockApi.get.mock.calls[0] as [string, { params: { page_size: number } }];
    expect(config.params.page_size).toBeGreaterThanOrEqual(23);
    expect(result).toHaveLength(23);
  });
});
