import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { userService } from "@/services/user.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => {
  resetMockApi();
});

describe("userService.list", () => {
  it("gọi GET /users với params và unwrap data theo envelope {message,data}", async () => {
    const response = {
      items: [
        {
          id: "u1",
          email: "a@b.com",
          user_name: "user01",
          full_name: "Nguyễn Văn A",
          avatar_url: null,
          is_active: true,
          is_verified: true,
          locked_reason: null,
          locked_at: null,
          last_login_at: null,
          created_at: "2026-09-01T00:00:00Z",
          system_roles: ["STUDENT"],
        },
      ],
      total_count: 1,
      page: 1,
      limit: 20,
      total_pages: 1,
    };
    mockApi.get.mockResolvedValue(envelope(response));

    const result = await userService.list({ keyword: "a@b.com", page: 1, limit: 20 });

    expect(mockApi.get).toHaveBeenCalledWith("/users", {
      params: { keyword: "a@b.com", page: 1, limit: 20 },
    });
    expect(result).toEqual(response);
  });
});

describe("userService.getById", () => {
  it("gọi GET /users/:id và unwrap data", async () => {
    const detail = {
      id: "u1",
      email: "a@b.com",
      user_name: "user01",
      full_name: null,
      avatar_url: null,
      phone: null,
      date_of_birth: null,
      is_active: true,
      is_verified: true,
      locked_reason: null,
      locked_at: null,
      last_login_at: null,
      created_at: "2026-09-01T00:00:00Z",
      system_roles: [{ id: "r1", name: "STUDENT", granted_at: "2026-09-01T00:00:00Z" }],
    };
    mockApi.get.mockResolvedValue(envelope(detail));

    const result = await userService.getById("u1");

    expect(mockApi.get).toHaveBeenCalledWith("/users/u1");
    expect(result).toEqual(detail);
  });
});

describe("userService.updateStatus", () => {
  it("khoá tài khoản — gửi is_active=false kèm reason", async () => {
    mockApi.put.mockResolvedValue(envelope({ id: "u1", is_active: false }));

    await userService.updateStatus("u1", { is_active: false, reason: "Vi phạm điều khoản" });

    expect(mockApi.put).toHaveBeenCalledWith("/users/u1/status", {
      is_active: false,
      reason: "Vi phạm điều khoản",
    });
  });

  it("mở khoá — gửi is_active=true không kèm reason", async () => {
    mockApi.put.mockResolvedValue(envelope({ id: "u1", is_active: true }));

    await userService.updateStatus("u1", { is_active: true });

    expect(mockApi.put).toHaveBeenCalledWith("/users/u1/status", { is_active: true });
  });
});
