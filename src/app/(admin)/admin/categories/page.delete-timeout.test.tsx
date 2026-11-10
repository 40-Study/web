/**
 * QA-C-16 (261110): xoá danh mục khi server chậm — hộp thoại đóng ngay, không trạng thái chờ, danh mục vẫn trên màn
 * dù audit log ghi "Xoá danh mục 200". Giờ: giữ hộp thoại kèm spinner, timeout thì tải lại và đối chiếu.
 */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import { toast } from "sonner";
import { NetworkError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import AdminCategoriesPage from "./page";

const CAT = { id: "c1", name: "QA-261110-Danh muc", description: "", is_active: true };
let serverCategories = [CAT];

beforeEach(() => {
  resetMockApi();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.warning).mockReset();
  serverCategories = [CAT];
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/categories") return envelope(serverCategories);
    throw new Error(`GET không mong đợi: ${url}`);
  });
});

async function openDeleteDialog() {
  renderWithProviders(<AdminCategoriesPage />);
  await screen.findByText(CAT.name);
  fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
  return screen.findByRole("dialog");
}

describe("AdminCategoriesPage — xoá danh mục khi request timeout (QA-C-16)", () => {
  it("đang gửi: hộp thoại vẫn mở, nút bị khoá (không đóng im lặng như trước)", async () => {
    let release!: () => void;
    mockApi.delete.mockImplementation(() => new Promise((resolve) => { release = () => resolve({ data: { message: "ok" } }); }));
    const dialog = await openDeleteDialog();

    fireEvent.click(within(dialog).getByRole("button", { name: "Xoá danh mục" }));

    await waitFor(() => expect((within(dialog).getByRole("button", { name: /Xoá danh mục/ }) as HTMLButtonElement).disabled).toBe(true));
    expect(screen.getByRole("dialog")).toBeTruthy();
    serverCategories = [];
    release();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("timeout nhưng server đã xoá: tải lại, đóng hộp thoại, báo đã xoá, không toast lỗi", async () => {
    mockApi.delete.mockImplementation(async () => {
      serverCategories = [];
      throw new NetworkError();
    });
    const dialog = await openDeleteDialog();

    fireEvent.click(within(dialog).getByRole("button", { name: "Xoá danh mục" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(screen.queryByText(CAT.name)).toBeNull());
    expect(toast.success).toHaveBeenCalledWith("Đã xoá danh mục", expect.anything());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("timeout và server chưa xoá: giữ hộp thoại, cảnh báo 'Chưa rõ kết quả'", async () => {
    mockApi.delete.mockRejectedValue(new NetworkError());
    await openDeleteDialog();

    fireEvent.click(screen.getByRole("button", { name: "Xoá danh mục" }));

    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith("Chưa rõ kết quả", expect.anything()));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
