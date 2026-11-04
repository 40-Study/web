/**
 * QA vòng 2, Lane G — trang /admin/organizations:
 *  - G2/G8 (N-01, N-13): tên "   " trước đây lọt qua `!form.name` và được POST lên (tạo tổ chức rỗng);
 *    ô trống thì bấm "Tạo" không có phản hồi. Nay trim + báo lỗi, KHÔNG gọi API.
 *  - G1 (N10/N-12): "Tạo lúc" phải là giờ Việt Nam của mốc backend trả, dù máy chạy UTC.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import OrganizationsPage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

// Backend mới trả RFC3339 có offset thật: 10:00 giờ VN ngày 28/09/2026.
const ORG = { id: "org-1", name: "ForteX", code: "FX", created_at: "2026-09-28T10:00:00+07:00" };

const originalTz = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "UTC";
});
afterAll(() => {
  process.env.TZ = originalTz;
});

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/organizations") return envelope({ organizations: [ORG] });
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  mockApi.post.mockImplementation(async (url: string, data: unknown) => {
    if (url === "/organizations") return envelope({ id: "org-new", ...(data as object) });
    throw new Error(`POST không mong đợi trong test: ${url}`);
  });
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["ORG_CREATE"]);
});

describe("/admin/organizations — G2/G8: không tạo tổ chức tên rỗng", () => {
  it("tên toàn khoảng trắng: hiện lỗi, KHÔNG gọi POST /organizations", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");

    fireEvent.change(screen.getByLabelText("Tên tổ chức"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    expect((await screen.findByRole("alert")).textContent).toContain("ít nhất 2 ký tự");
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it("tên hợp lệ có khoảng trắng thừa: gửi tên đã trim", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");

    fireEvent.change(screen.getByLabelText("Tên tổ chức"), { target: { value: "  Trường ABC  " } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    expect(mockApi.post.mock.calls[0][0]).toBe("/organizations");
    expect(mockApi.post.mock.calls[0][1]).toEqual(expect.objectContaining({ name: "Trường ABC" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("/admin/organizations — G1: giờ tạo hiển thị theo giờ Việt Nam", () => {
  it("created_at 10:00 +07:00 hiện '10:00 28/09/2026' khi máy chạy UTC", async () => {
    renderWithProviders(<OrganizationsPage />);
    fireEvent.click(await screen.findByText("ForteX"));

    expect(await screen.findByText("10:00 28/09/2026")).toBeTruthy();
  });
});

describe("/admin/organizations — QA3-10/17: giữ tên khi lỗi, nút xoá bằng tiếng Việt", () => {
  it("tạo trùng tên bị server từ chối: tên đã gõ KHÔNG bị xoá", async () => {
    mockApi.post.mockRejectedValueOnce(new Error("Tên tổ chức đã tồn tại"));
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");
    const input = screen.getByLabelText("Tên tổ chức") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "ForteX" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    expect(input.value).toBe("ForteX");
  });

  it("tạo thành công: form được xoá", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");
    const input = screen.getByLabelText("Tên tổ chức") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Trường ABC" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    await waitFor(() => expect(input.value).toBe(""));
  });

  it("nút làm sạch form là tiếng Việt, không còn chữ 'Reset'", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");
    expect(screen.getByRole("button", { name: "Xoá nội dung đã nhập" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
  });
});
