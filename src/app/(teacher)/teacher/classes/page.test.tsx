/**
 * QA2 Q2-06: /teacher/classes trả 404 — lớp chỉ vào được từ chi tiết khoá học. Trang này liệt kê
 * mọi lớp giảng viên phụ trách (GET /classes/me) và dẫn tới trang quản lý / điểm danh của từng lớp.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import TeacherClassesPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

beforeEach(() => resetMockApi());

describe("TeacherClassesPage", () => {
  it("liệt kê lớp của giảng viên với trạng thái, sĩ số và liên kết quản lý / điểm danh", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        classes: [
          { id: "cls-1", name: "Lớp Go sáng T2", status: "active", student_count: 12, teacher_count: 2, course_id: "crs-1" },
          { id: "cls-2", name: "Lớp nháp", status: "draft", student_count: 0, teacher_count: 1 },
        ],
      }),
    );
    renderWithProviders(<TeacherClassesPage />);

    expect(await screen.findByText("Lớp Go sáng T2")).toBeTruthy();
    expect(screen.getByText("Lớp nháp")).toBeTruthy();
    expect(screen.getByText("Đang hoạt động")).toBeTruthy();
    expect(screen.getByText("Nháp")).toBeTruthy();
    expect(screen.getByText(/12 học viên/)).toBeTruthy();

    const manage = screen.getByRole("link", { name: /Lớp Go sáng T2/ });
    expect(manage.getAttribute("href")).toBe("/teacher/classes/cls-1");
    const attendance = screen.getAllByRole("link", { name: /Điểm danh/ })[0];
    expect(attendance.getAttribute("href")).toBe("/teacher/classes/cls-1/attendance");
    expect(screen.getByRole("link", { name: /Xem khoá học/ }).getAttribute("href")).toBe("/teacher/courses/crs-1");
  });

  // QA-B-12: lớp đã qua ngày kết thúc (backend trả is_ended) từng vẫn ghi "Đang hoạt động".
  it("lớp backend báo is_ended: ghi 'Đã kết thúc'; thiếu trường thì giữ nhãn cũ", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        classes: [
          { id: "cls-1", name: "Flutter K5", status: "active", is_ended: true, student_count: 1, teacher_count: 1 },
          { id: "cls-2", name: "React K12", status: "active", student_count: 2, teacher_count: 1 },
        ],
      }),
    );
    renderWithProviders(<TeacherClassesPage />);

    const ended = (await screen.findByText("Flutter K5")).closest("li") as HTMLElement;
    expect(ended.textContent).toContain("Đã kết thúc");
    expect(ended.textContent).not.toContain("Đang hoạt động");
    const running = screen.getByText("React K12").closest("li") as HTMLElement;
    expect(running.textContent).toContain("Đang hoạt động");
  });

  it("chưa có lớp nào: hiện trạng thái rỗng, không phải trang trắng", async () => {
    mockApi.get.mockResolvedValue(envelope({ classes: [] }));
    renderWithProviders(<TeacherClassesPage />);
    expect(await screen.findByText(/Bạn chưa có lớp nào/)).toBeTruthy();
  });

  it("lỗi tải: báo lỗi và có nút Thử lại gọi lại API (không quay mãi)", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(
      envelope({ classes: [{ id: "cls-1", name: "Lớp hồi phục", status: "active", student_count: 1, teacher_count: 1 }] }),
    );
    renderWithProviders(<TeacherClassesPage />);

    const retry = await screen.findByRole("button", { name: "Thử lại" });
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(retry);
    await waitFor(() => expect(screen.getByText("Lớp hồi phục")).toBeTruthy());
  });

  it("Q3-15: mỗi lớp có nhãn nguồn: 'Cá nhân' khi không có organization_id, nhãn tổ chức khi có", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        classes: [
          { id: "cls-1", name: "Lớp cá nhân", status: "active" },
          { id: "cls-2", name: "Lớp tổ chức", status: "active", organization_id: "org-1" },
        ],
      }),
    );
    renderWithProviders(<TeacherClassesPage />);

    await screen.findByText("Lớp cá nhân");
    expect(screen.getAllByText("Cá nhân")).toHaveLength(1);
    // Chưa tra được tên tổ chức (chưa đăng nhập trong test): nhãn chung "Tổ chức", không bao giờ là UUID.
    expect(screen.getAllByText("Tổ chức")).toHaveLength(1);
    expect(screen.queryByText("org-1")).toBeNull();
  });
});
