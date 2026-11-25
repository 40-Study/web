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

  it("giữ mã dòng gán + mã vai trò theo từng vai trò (để gỡ/gán), không trùng khi lặp vai trò", () => {
    const members = groupOrgMembers([
      row({ id: "a1" }) as never,
      row({ id: "a2", role_id: "role2", role: { id: "role2", name: "GIANG_VIEN" } }) as never,
      row({ id: "a3" }) as never,
    ]);
    expect(members[0].assignments).toEqual([
      { id: "a1", role_id: "role1", name: "ORG_OWNER" },
      { id: "a2", role_id: "role2", name: "GIANG_VIEN" },
    ]);
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

  // QA6-A14: tổ chức có hơn 100 dòng gán vai trò bị cắt im lặng ở trang đầu và "Thành viên (N)" đếm thiếu.
  it("getMembers đọc MỌI trang khi total vượt một trang và gộp theo người", async () => {
    const owner = (n: number) =>
      row({ id: `r${n}`, user_id: `u${n}`, user: { id: `u${n}`, user_name: `user${n}`, full_name: `Người ${n}`, email: `u${n}@example.com` } });
    const pages: Record<number, unknown[]> = {
      1: [owner(1), owner(2)],
      2: [owner(3), owner(4)],
      3: [owner(5)],
    };
    mockApi.get.mockImplementation(async (_url: string, config: { params: { page: number } }) =>
      envelope({ user_organization_roles: pages[config.params.page], total: 5 })
    );

    const members = await organizationService.getMembers("org-1");

    expect(members.map((m) => m.user_id)).toEqual(["u1", "u2", "u3", "u4", "u5"]);
    expect(mockApi.get.mock.calls.map((call) => (call[1] as { params: { page: number } }).params.page).sort()).toEqual([1, 2, 3]);
  });

  it("getMembers: một người nhiều vai nằm ở hai trang vẫn là MỘT thành viên", async () => {
    const pages: Record<number, unknown[]> = {
      1: [row({ id: "a1" })],
      2: [row({ id: "a2", role_id: "role2", role: { id: "role2", name: "GIANG_VIEN" } })],
    };
    mockApi.get.mockImplementation(async (_url: string, config: { params: { page: number } }) =>
      envelope({ user_organization_roles: pages[config.params.page], total: 2 })
    );

    const members = await organizationService.getMembers("org-1");

    expect(members).toHaveLength(1);
    expect(members[0].roles).toEqual(["ORG_OWNER", "GIANG_VIEN"]);
  });

  it("getMembers: tổ chức rỗng không gọi thêm trang", async () => {
    mockApi.get.mockResolvedValue(envelope({ user_organization_roles: [], total: 0 }));
    expect(await organizationService.getMembers("org-1")).toEqual([]);
    expect(mockApi.get).toHaveBeenCalledTimes(1);
  });

  // Q6 #132 L1: không có `total` thì trang đầu đầy từng làm cắt im lặng ở 100 dòng.
  describe("getMembers khi backend không trả total", () => {
    const owner = (n: number) =>
      row({ id: `r${n}`, user_id: `u${n}`, user: { id: `u${n}`, user_name: `user${n}`, full_name: `Người ${n}`, email: `u${n}@example.com` } });
    const full = (from: number) => Array.from({ length: 100 }, (_, i) => owner(from + i));

    it("trang đầu đầy -> đi tiếp tới trang chưa đầy, không cắt ở trang đầu", async () => {
      const pages: Record<number, unknown[]> = { 1: full(0), 2: full(100), 3: [owner(200)] };
      mockApi.get.mockImplementation(async (_url: string, config: { params: { page: number } }) =>
        envelope({ user_organization_roles: pages[config.params.page] })
      );
      const members = await organizationService.getMembers("org-1");
      expect(members).toHaveLength(201);
      expect(mockApi.get).toHaveBeenCalledTimes(3);
    });

    it("trang đầu chưa đầy -> chỉ một request", async () => {
      mockApi.get.mockResolvedValue(envelope({ user_organization_roles: [owner(1)] }));
      expect(await organizationService.getMembers("org-1")).toHaveLength(1);
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it("máy chủ luôn trả trang đầy -> báo lỗi rõ ràng khi chạm trần, không lặp vô hạn", async () => {
      mockApi.get.mockResolvedValue(envelope({ user_organization_roles: full(0) }));
      await expect(organizationService.getMembers("org-1")).rejects.toThrow(/vượt 100 trang/);
      expect(mockApi.get).toHaveBeenCalledTimes(100);
    });
  });

  it("getClasses gọi /organizations/:id/classes kèm bộ lọc", async () => {
    mockApi.get.mockResolvedValue(envelope({ classes: [], total: 0, page: 1, page_size: 20 }));
    await organizationService.getClasses("org-1", { status: "draft", keyword: "toan" });
    expect(mockApi.get).toHaveBeenCalledWith("/organizations/org-1/classes", {
      params: { page: 1, page_size: 20, status: "draft", keyword: "toan" },
    });
  });
});
