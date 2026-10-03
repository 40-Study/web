import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { groupOrgMembers, organizationService } from "@/services/organization.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => {
  resetMockApi();
});

const row = (over: Record<string, unknown>) => ({
  id: "r1",
  user_id: "u1",
  role_id: "role1",
  status: "active",
  user: { id: "u1", user_name: "an", full_name: "Nguyễn An", email: "an@example.com" },
  role: { id: "role1", name: "ORG_OWNER" },
  ...over,
});

describe("groupOrgMembers (B-16)", () => {
  it("hiện tên, email và gộp nhiều vai trò của một người", () => {
    const members = groupOrgMembers([
      row({}) as never,
      row({ id: "r2", role_id: "role2", role: { id: "role2", name: "GIANG_VIEN" } }) as never,
      row({ id: "r3", user_id: "u2", user: { id: "u2", user_name: "binh", email: "b@example.com" }, role: { id: "x", name: "THANH_VIEN" } }) as never,
    ]);
    expect(members).toHaveLength(2);
    expect(members[0]).toMatchObject({ user_id: "u1", name: "Nguyễn An", email: "an@example.com", roles: ["ORG_OWNER", "GIANG_VIEN"] });
    expect(members[1]).toMatchObject({ name: "binh", roles: ["THANH_VIEN"] });
  });

  it("bỏ vai trò đã bị gỡ; thiếu thông tin người dùng thì không in user_id trần", () => {
    const members = groupOrgMembers([
      row({ status: "inactive" }) as never,
      row({ id: "r9", user_id: "u9", user: undefined }) as never,
    ]);
    expect(members).toHaveLength(1);
    expect(members[0].name).toBe("Người dùng không rõ");
  });
});

describe("organizationService", () => {
  it("getMembers đọc user_organization_roles và gộp theo người", async () => {
    mockApi.get.mockResolvedValue(envelope({ user_organization_roles: [row({})], total: 1 }));
    const members = await organizationService.getMembers("org-1");
    expect(mockApi.get).toHaveBeenCalledWith("/organizations/org-1/members", expect.objectContaining({ params: expect.objectContaining({ status: "active" }) }));
    expect(members[0].email).toBe("an@example.com");
  });

  it("getClasses gọi /organizations/:id/classes kèm bộ lọc", async () => {
    mockApi.get.mockResolvedValue(envelope({ classes: [], total: 0, page: 1, page_size: 20 }));
    await organizationService.getClasses("org-1", { status: "draft", keyword: "toan" });
    expect(mockApi.get).toHaveBeenCalledWith("/organizations/org-1/classes", {
      params: { page: 1, page_size: 20, status: "draft", keyword: "toan" },
    });
  });
});
