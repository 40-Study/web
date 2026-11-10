/**
 * QA-B-27: người đang dùng vai khác (Giảng viên) mở /org/* từng bị đẩy sang /403 dù có vai Chủ tổ chức. Nay khu /org
 * hiện lối chuyển sang vai Chủ tổ chức của từng tổ chức; người không có vai đó được nói rõ lý do.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/org/classes",
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import OrgLayout from "./layout";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const TEACHER = { id: "r-teacher", type: "system", role_name: "TEACHER" } as const;
const OWNER = {
  id: "r-owner",
  type: "organization",
  role_name: "ORG_OWNER",
  organization_id: "org-1",
  organization_name: "Trung tâm ABC",
} as const;

function setup(roles: readonly object[]) {
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/auth/my-roles") return envelope({ roles });
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setActiveRole("TEACHER");
  renderWithProviders(
    <OrgLayout>
      <div>NOI DUNG TO CHUC</div>
    </OrgLayout>
  );
}

beforeEach(() => {
  useAuthStore.getState().reset();
  resetMockApi();
  replace.mockClear();
});

describe("(org)/layout — QA-B-27: lối vào khu tổ chức khi đang dùng vai khác", () => {
  it("có vai Chủ tổ chức: hiện nút chuyển theo tổ chức, bấm thì gọi switch-role đúng tổ chức, không sang /403", async () => {
    mockApi.post.mockImplementation(async () => new Promise(() => {}));
    setup([TEACHER, OWNER]);

    const btn = await screen.findByRole("button", { name: /Chủ tổ chức · Trung tâm ABC/ });
    expect(screen.queryByText("NOI DUNG TO CHUC")).toBeNull();
    expect(replace).not.toHaveBeenCalledWith("/403");

    fireEvent.click(btn);
    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith("/auth/switch-role", {
        role_id: "r-owner",
        role_type: "organization",
        organization_id: "org-1",
      })
    );
  });

  it("không có vai Chủ tổ chức: nói rõ lý do, không có nút chuyển", async () => {
    setup([TEACHER]);

    expect(await screen.findByText(/chưa là chủ của tổ chức nào/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Chủ tổ chức ·/ })).toBeNull();
    expect(replace).not.toHaveBeenCalledWith("/403");
  });
});
