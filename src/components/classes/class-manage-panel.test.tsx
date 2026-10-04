/**
 * B-12: quản lý lớp từ giao diện. Nút chỉ hiện khi backend báo can_manage / can_assign_teachers (cùng hàm kiểm với
 * API ghi), và mỗi thao tác gọi đúng endpoint /classes/:id/*. Test ĐỎ nếu UI tự suy quyền từ vai trò hoặc bỏ nút kích hoạt.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: vi.fn() } }));

import { ClassManagePanel } from "./class-manage-panel";
import { NotFoundError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const CLASS_ID = "c1";

function serve(cls: Record<string, unknown>) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === `/classes/${CLASS_ID}`) return Promise.resolve(envelope({ id: CLASS_ID, name: "Lớp A", teacher_count: 1, student_count: 1, ...cls }));
    if (url.endsWith("/teachers") && url.startsWith("/classes/"))
      return Promise.resolve(envelope({ teachers: [{ id: "tc1", teacher_id: "t1", role: "primary", teacher: { user_name: "gv1", full_name: "Cô Lan" } }], total: 1 }));
    if (url.endsWith("/students"))
      return Promise.resolve(envelope({ students: [{ id: "sc1", student_id: "s1", user_name: "hs1", full_name: "Bé Minh", status: "active" }], total: 1, page: 1, page_size: 100 }));
    if (url.endsWith("/enrollable-students")) return Promise.resolve(envelope({ students: [{ id: "s2", user_name: "hs2", full_name: "Bé Hoa" }] }));
    // Ô chọn giảng viên đọc /classes/:id/assignable-teachers (backend lọc theo thành viên tổ chức), không phải /teachers công khai.
    if (url === `/classes/${CLASS_ID}/assignable-teachers`)
      return Promise.resolve(envelope({ teachers: [{ id: "t2", user_name: "gv2", full_name: "Thầy Nam" }] }));
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  mockApi.put.mockResolvedValue(envelope({}));
  mockApi.post.mockResolvedValue(envelope({}));
  mockApi.delete.mockResolvedValue(envelope(null));
}

beforeEach(() => {
  resetMockApi();
  toastSuccess.mockClear();
});

describe("ClassManagePanel", () => {
  it("người quản lý lớp nháp: thấy 'Kích hoạt lớp' và nhãn tiếng Việt, bấm thì PUT status=active", async () => {
    serve({ status: "draft", can_manage: true, can_assign_teachers: true });
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);

    expect(await screen.findByText("Nháp")).toBeTruthy();
    expect(screen.queryByText("draft")).toBeNull();
    await userEvent.click(await screen.findByRole("button", { name: /Kích hoạt lớp/ }));
    await waitFor(() => expect(mockApi.put).toHaveBeenCalledWith(`/classes/${CLASS_ID}`, { status: "active" }));
  });

  it("ghi danh học viên chọn từ danh sách (không dán id) và gỡ giảng viên có hộp xác nhận", async () => {
    serve({ status: "active", can_manage: true, can_assign_teachers: true });
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);

    await userEvent.click(await screen.findByRole("button", { name: "Ghi danh Bé Hoa" }));
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith(`/classes/${CLASS_ID}/students`, { student_id: "s2" }));

    await userEvent.click(await screen.findByRole("button", { name: "Gán Thầy Nam" }));
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith(`/classes/${CLASS_ID}/teachers`, { teacher_id: "t2", role: "primary" }));

    await userEvent.click(screen.getByRole("button", { name: "Gỡ giảng viên Cô Lan" }));
    expect(mockApi.delete).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole("button", { name: "Gỡ khỏi lớp" }));
    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith(`/classes/${CLASS_ID}/teachers/t1`));
  });

  it("giảng viên được gán (can_manage nhưng không can_assign_teachers): ẩn gán/gỡ giảng viên, vẫn ghi danh được", async () => {
    serve({ status: "active", can_manage: true });
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);

    await screen.findByText("Cô Lan");
    expect(screen.queryByRole("button", { name: /Gỡ giảng viên/ })).toBeNull();
    expect(screen.queryByPlaceholderText("Tìm giảng viên theo tên")).toBeNull();
    expect(await screen.findByPlaceholderText("Tìm học viên để ghi danh")).toBeTruthy();
  });

  it("người quản lý chỉ được lưu trữ lớp: có 'Lưu trữ lớp' (hộp xác nhận, PUT status=archived), không có nút xoá", async () => {
    serve({ status: "active", can_manage: true, can_assign_teachers: true });
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);

    await userEvent.click(await screen.findByRole("button", { name: "Lưu trữ lớp" }));
    expect(mockApi.put).not.toHaveBeenCalled();
    const buttons = await screen.findAllByRole("button", { name: "Lưu trữ lớp" });
    await userEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(mockApi.put).toHaveBeenCalledWith(`/classes/${CLASS_ID}`, { status: "archived" }));
    expect(mockApi.delete).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Xoá lớp|Xóa lớp|Xoá vĩnh viễn/ })).toBeNull();
  });

  it("lớp đã lưu trữ: không còn nút 'Lưu trữ lớp'", async () => {
    serve({ status: "archived", can_manage: true, can_assign_teachers: true });
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);

    expect(await screen.findByText("Đã lưu trữ")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lưu trữ lớp" })).toBeNull();
  });

  it("lớp đã lưu trữ: nhãn + thông báo chỉ đọc, ẩn mọi nút ghi (ghi danh, gán, gỡ), vẫn xem được danh sách", async () => {
    serve({ status: "archived", can_manage: true, can_assign_teachers: true });
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);

    expect(await screen.findByText("Bé Minh")).toBeTruthy();
    expect(screen.getByText("Cô Lan")).toBeTruthy();
    expect(screen.getByText("Đã lưu trữ")).toBeTruthy();
    expect(screen.getByText(/Lớp đã lưu trữ: chỉ xem/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Gỡ học viên/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Gỡ giảng viên/ })).toBeNull();
    expect(screen.queryByPlaceholderText("Tìm học viên để ghi danh")).toBeNull();
    expect(screen.queryByPlaceholderText("Tìm giảng viên theo tên")).toBeNull();
    expect(screen.queryByText("Bạn chỉ có quyền xem lớp này.")).toBeNull();
  });

  it("lớp đã lưu trữ + có quyền quản lý: 'Mở lại lớp' gọi PUT status=active", async () => {
    serve({ status: "archived", can_manage: true, can_assign_teachers: true });
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);

    await userEvent.click(await screen.findByRole("button", { name: "Mở lại lớp" }));
    await waitFor(() => expect(mockApi.put).toHaveBeenCalledWith(`/classes/${CLASS_ID}`, { status: "active" }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Đã mở lại lớp"));
    expect(toastSuccess).not.toHaveBeenCalledWith("Đã kích hoạt lớp");
  });

  it("lớp đã lưu trữ + chỉ xem (không can_manage): không có 'Mở lại lớp'", async () => {
    serve({ status: "archived" });
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);

    await screen.findByText("Bé Minh");
    expect(screen.queryByRole("button", { name: "Mở lại lớp" })).toBeNull();
  });

  it("chỉ có quyền xem (không có cờ nào): không có nút kích hoạt, ghi danh, gỡ", async () => {
    serve({ status: "draft" });
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);

    await screen.findByText("Bé Minh");
    expect(screen.queryByRole("button", { name: /Kích hoạt lớp/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Lưu trữ lớp" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Gỡ học viên/ })).toBeNull();
    expect(screen.queryByPlaceholderText("Tìm học viên để ghi danh")).toBeNull();
    expect(screen.getByText("Bạn chỉ có quyền xem lớp này.")).toBeTruthy();
  });

  it("lớp không xem được (404): hiện 'Không tìm thấy lớp' thay vì trang trắng", async () => {
    mockApi.get.mockRejectedValue(new NotFoundError("class not found"));
    renderWithProviders(<ClassManagePanel classId={CLASS_ID} />);
    expect(await screen.findByText("Không tìm thấy lớp")).toBeTruthy();
    expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull();
  });
});
