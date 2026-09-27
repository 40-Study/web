/**
 * A-P2-2 regression — dashboard /admin trước đây:
 *  - "Tổng user được gán role" luôn hardcode "—" dù có dữ liệu.
 *  - "Top vai trò theo số lượng user" chỉ `roles.slice(0, 4)` — không sắp xếp theo số user thật,
 *    nên nhãn "Top" sai (thứ tự ngẫu nhiên theo API).
 *
 * Test ĐỎ nếu "—" quay lại xuất hiện dù có dữ liệu, hoặc nếu role có ÍT user hơn lại đứng
 * trước role có NHIỀU user hơn trong danh sách "Top vai trò".
 */

import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import AdminIndexPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

// STUDENT có ít user hơn TEACHER — nếu sort đúng, TEACHER phải đứng TRƯỚC STUDENT trong "Top".
const ROLES = [
  { id: "role-student", name: "STUDENT", description: "Học viên" },
  { id: "role-teacher", name: "TEACHER", description: "Giảng viên" },
];

const USER_COUNT_BY_ROLE: Record<string, number> = {
  "role-student": 2,
  "role-teacher": 7,
};

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/organizations") return envelope({ organizations: [{ id: "org-1", name: "ForteX", code: "FX" }] });
    if (url === "/system-roles") return envelope({ roles: ROLES });
    if (url === "/permissions") return envelope({ permissions: [{ id: "p1", name: "PERM_1", category: "X" }], total: 1 });
    const usersMatch = url.match(/^\/system-roles\/([^/]+)\/users$/);
    if (usersMatch) {
      const total = USER_COUNT_BY_ROLE[usersMatch[1]] ?? 0;
      return envelope({ user_system_roles: [], total, page: 1, page_size: 1 });
    }
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
});

describe("/admin dashboard — A-P2-2", () => {
  it("Tổng lượt gán role hiển thị số thật (2 + 7 = 9), không còn '—'", async () => {
    renderWithProviders(<AdminIndexPage />);

    await screen.findByText("9");
    expect(screen.queryByText("—")).toBeNull();
  });

  it("Top vai trò sắp xếp GIẢM DẦN theo số user — TEACHER (7) đứng trước STUDENT (2)", async () => {
    renderWithProviders(<AdminIndexPage />);

    const heading = await screen.findByText("Top vai trò theo số lượng user");
    const panel = heading.closest("div");
    if (!panel) throw new Error("Không tìm thấy panel Top vai trò");

    await screen.findByText("STUDENT", { selector: "p" });
    const rowTexts = within(panel)
      .getAllByText(/^(STUDENT|TEACHER)$/)
      .map((el) => el.textContent);

    expect(rowTexts.indexOf("TEACHER")).toBeLessThan(rowTexts.indexOf("STUDENT"));
  });
});
