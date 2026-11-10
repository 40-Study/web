/** QA-C-19: khu admin có màn quản lý tag, dùng đúng CRUD /tags sẵn có của backend. */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import AdminTagsPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/tags") return envelope({ tags: [{ id: "t1", name: "Python", created_at: "2026-10-01T10:00:00+07:00" }], total: 1 });
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  mockApi.post.mockImplementation(async (_url: string, data: unknown) => envelope({ id: "t2", ...(data as object) }));
});

describe("/admin/tags", () => {
  it("liệt kê tag từ GET /tags kèm phân trang", async () => {
    renderWithProviders(<AdminTagsPage />);
    expect(await screen.findByText("Python")).toBeTruthy();
    expect(mockApi.get).toHaveBeenCalledWith("/tags", expect.objectContaining({ params: expect.objectContaining({ page: 1, page_size: 20 }) }));
  });

  it("tên trống: báo lỗi, không gọi POST; tên hợp lệ: POST /tags với tên đã trim", async () => {
    renderWithProviders(<AdminTagsPage />);
    await screen.findByText("Python");
    fireEvent.click(screen.getByRole("button", { name: "Tạo tag" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Nhập tên tag");
    expect(mockApi.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Tên tag"), { target: { value: "  Go  " } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo tag" }));
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith("/tags", { name: "Go" }));
  });
});
