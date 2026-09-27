/**
 * A-P1-1 regression — roleService.getSystemRoleUsers() TRƯỚC ĐÂY khai kiểu sai
 * (`R<unknown[]>`, coi response là mảng trần) trong khi backend thật trả
 * { user_system_roles: [...], total, page, page_size }. Type sai không tự lộ ra ở test cũ
 * (không có test), chỉ vỡ khi dùng thật ở UI. Test này khẳng định service unwrap đúng field
 * `user_system_roles` + `total` — ĐỎ nếu quay lại coi response là mảng trần.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { roleService } from "@/services/role.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => {
  resetMockApi();
});

describe("roleService.getSystemRoleUsers", () => {
  it("unwrap đúng { user_system_roles, total } — không coi response là mảng trần", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        user_system_roles: [
          {
            id: "usr-1",
            user_id: "11111111-1111-1111-1111-111111111111",
            system_role_id: "role-1",
            granted_at: "2026-09-27T10:00:00Z",
            status: "active",
            created_at: "2026-09-27T10:00:00Z",
            updated_at: "2026-09-27T10:00:00Z",
          },
        ],
        total: 2,
        page: 1,
        page_size: 100,
      })
    );

    const result = await roleService.getSystemRoleUsers("role-1", { page_size: 100 });

    expect(mockApi.get).toHaveBeenCalledWith(
      "/system-roles/role-1/users",
      expect.objectContaining({ params: { page_size: 100 } })
    );
    // Trước đây (bug): result sẽ là mảng data.data thẳng; giờ phải là object có total/user_system_roles.
    expect(result.total).toBe(2);
    expect(result.user_system_roles).toHaveLength(1);
    expect(result.user_system_roles[0].user_id).toBe("11111111-1111-1111-1111-111111111111");
    // Đảm bảo KHÔNG có field tên/email bịa — backend thật không trả field này.
    expect((result.user_system_roles[0] as unknown as Record<string, unknown>).email).toBeUndefined();
  });
});
