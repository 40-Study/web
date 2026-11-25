/**
 * Q7-T04 / Q7-T05: "Lưu nháp" ở bước 1 khi chưa có giá từng nhảy thẳng sang bước 3 kèm toast đỏ, và thanh bước tick
 * xanh bước 1 + 2 chỉ vì chúng nằm trước bước hiện tại (bước 2 chưa có ảnh bìa/mô tả). Giờ: ở yên bước hiện tại,
 * hiện lý do + lối sang bước giá; tick theo bước đã hợp lệ; một lần lưu thành công chỉ một toast.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }) }));

const createCourse = vi.fn();
vi.mock("@/hooks/queries/use-courses", () => ({
  useCreateCourse: () => ({ mutateAsync: createCourse, isPending: false }),
}));
vi.mock("@/hooks/queries/use-categories", () => ({ useCategoryList: () => ({ data: [] }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("../_components/course-basic-info-step", () => ({
  CourseBasicInfoStep: ({ update }: { update: (k: "title", v: string) => void }) => (
    <input aria-label="Tên khoá học" onChange={(e) => update("title", e.target.value)} />
  ),
}));
vi.mock("../_components/course-media-step", () => ({
  CourseMediaStep: ({ update }: { update: (k: string, v: string) => void }) => (
    <>
      <button type="button" onClick={() => update("thumbnail_url", "https://cdn.example/cover.png")}>
        có ảnh bìa
      </button>
      <input aria-label="Mô tả chi tiết" onChange={(e) => update("description", e.target.value)} />
    </>
  ),
}));

// eslint-disable-next-line import/first
import CreateCoursePage from "./page";

const draftButton = () => screen.getAllByRole("button", { name: "Lưu nháp" })[0];
const stepState = (title: string) =>
  screen.getByRole("button", { name: new RegExp(title) }).getAttribute("data-step-state");

describe("wizard tạo khoá — Lưu nháp thiếu giá (Q7-T04)", () => {
  beforeEach(() => {
    createCourse.mockReset().mockResolvedValue({ id: "course-new" });
    push.mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("ở bước 1: không nhảy bước, không tạo khoá, nói rõ thiếu giá và có lối sang bước giá", () => {
    render(<CreateCoursePage />);
    fireEvent.change(screen.getByLabelText("Tên khoá học"), { target: { value: "Khoá test" } });
    fireEvent.click(draftButton());

    expect(createCourse).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Cài đặt giá" })).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Vui lòng nhập giá bán lớn hơn 0 hoặc chọn Miễn phí.");

    fireEvent.click(screen.getByRole("button", { name: "Đến bước Cài đặt giá" }));
    expect(screen.getByRole("heading", { name: "Cài đặt giá" })).toBeTruthy();
  });

  it("tick bước theo điều kiện của bước, không theo vị trí: bước 2 thiếu ảnh/mô tả thì không tick", () => {
    render(<CreateCoursePage />);
    fireEvent.change(screen.getByLabelText("Tên khoá học"), { target: { value: "Khoá test" } });
    fireEvent.click(screen.getAllByRole("button", { name: /Tiếp tục/ })[0]); // -> bước 2 (chưa có ảnh bìa)
    expect(stepState("Thông tin cơ bản")).toBe("completed");
    expect(stepState("Hình ảnh & Mô tả")).toBe("current");
  });

  it("lưu nháp thành công chỉ báo một toast thành công", async () => {
    render(<CreateCoursePage />);
    fireEvent.change(screen.getByLabelText("Tên khoá học"), { target: { value: "Khoá test" } });
    const next = () => screen.getAllByRole("button", { name: /Tiếp tục/ })[0];
    fireEvent.click(next()); // -> bước 2
    fireEvent.click(screen.getByRole("button", { name: "có ảnh bìa" }));
    fireEvent.change(screen.getByLabelText("Mô tả chi tiết"), { target: { value: "Mô tả" } });
    fireEvent.click(next()); // -> bước 3
    fireEvent.click(screen.getByRole("button", { name: /Miễn phí/ }));
    fireEvent.click(draftButton());
    await waitFor(() => expect(createCourse).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledTimes(1);
  });
});
