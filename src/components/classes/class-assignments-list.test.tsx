/**
 * R7: danh sách bài tập trong chi tiết lớp của khu tổ chức. Mỗi bài dẫn tới trang chấm; có đủ trạng thái
 * rỗng / lỗi / đang tải; lớp không xem được (404) không vẽ thêm lỗi vì ClassManagePanel đã nói "Không tìm thấy lớp".
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { ClassAssignmentsList } from "./class-assignments-list";
import { NotFoundError } from "@/lib/errors";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const hrefFor = (id: string) => `/org/classes/c1/assignments/${id}`;

function assignment(over: Record<string, unknown> = {}) {
  return {
    id: "a1",
    class_id: "c1",
    type: "homework",
    title: "Bài tập giỏ hàng",
    is_published: true,
    end_time: "2026-10-20T10:00:00+07:00",
    ...over,
  };
}

beforeEach(() => {
  resetMockApi();
});

describe("ClassAssignmentsList", () => {
  it("có dữ liệu: mỗi bài là link tới trang chấm, hiện trạng thái công bố và loại bài", async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [assignment(), assignment({ id: "a2", title: "Dự án cuối khoá", type: "project", is_published: false })],
        total: 2,
        page: 1,
        page_size: 50,
      },
    });
    renderWithProviders(<ClassAssignmentsList classId="c1" hrefFor={hrefFor} />);

    const link = await screen.findByRole("link", { name: /Bài tập giỏ hàng/ });
    expect(link.getAttribute("href")).toBe("/org/classes/c1/assignments/a1");
    expect(screen.getByRole("link", { name: /Dự án cuối khoá/ }).getAttribute("href")).toBe("/org/classes/c1/assignments/a2");
    expect(screen.getByText("Đã công bố")).toBeTruthy();
    expect(screen.getByText("Nháp")).toBeTruthy();
    expect(screen.getByText("Bài tập (2)")).toBeTruthy();
    expect(mockApi.get).toHaveBeenCalledWith("/classes/c1/assignments", { params: { page: 1, page_size: 50 } });
  });

  it("rỗng: hiện thông báo lớp chưa có bài tập, không có link", async () => {
    mockApi.get.mockResolvedValue({ data: { data: [], total: 0, page: 1, page_size: 50 } });
    renderWithProviders(<ClassAssignmentsList classId="c1" hrefFor={hrefFor} />);

    expect(await screen.findByText("Lớp chưa có bài tập")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("lỗi tải: hiện lỗi kèm nút Thử lại", async () => {
    mockApi.get.mockRejectedValue(new Error("boom"));
    renderWithProviders(<ClassAssignmentsList classId="c1" hrefFor={hrefFor} />);

    expect(await screen.findByText("Không thể tải dữ liệu")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });

  it("lớp không xem được (404): không vẽ gì, tránh hai lỗi cạnh nhau", async () => {
    mockApi.get.mockRejectedValue(new NotFoundError("Không tìm thấy lớp"));
    const { container } = renderWithProviders(<ClassAssignmentsList classId="c1" hrefFor={hrefFor} />);

    await vi.waitFor(() => expect(mockApi.get).toHaveBeenCalled());
    await vi.waitFor(() => expect(container.textContent).toBe(""));
  });

  it("đang tải: hiện skeleton trạng thái status", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ClassAssignmentsList classId="c1" hrefFor={hrefFor} />);

    expect(screen.getByRole("status")).toBeTruthy();
  });
});
