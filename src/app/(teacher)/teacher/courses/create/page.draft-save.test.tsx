/**
 * Q7-T04 / Q7-T05: "Lưu nháp" ở bước 1 khi chưa có giá từng nhảy thẳng sang bước 3 kèm toast đỏ. Giờ: ở yên bước
 * hiện tại, hiện lý do + lối sang bước giá (lý do mất khi đổi bước, L4); một lần lưu thành công chỉ một toast.
 * Quy tắc tick thanh bước (theo bước hợp lệ, không theo vị trí) nằm ở page.step-tick.test.tsx.
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

// Có hai nút "Quay lại": đầu trang (về danh sách khoá) và cuối trang (về bước trước). Cần cái cuối.
const backButton = () => screen.getAllByRole("button", { name: /Quay lại/ }).at(-1)!;
const draftButton = () => screen.getAllByRole("button", { name: "Lưu nháp" })[0];

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

  it("lý do chặn lưu nháp mất khi sang bước khác, không hiện lại khi chưa bấm lưu (L4)", () => {
    render(<CreateCoursePage />);
    fireEvent.change(screen.getByLabelText("Tên khoá học"), { target: { value: "Khoá test" } });
    fireEvent.click(draftButton());
    expect(screen.getByRole("alert")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /Tiếp tục/ })[0]); // -> bước 2
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(backButton()); // -> bước 1, giá vẫn thiếu
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sau khi sửa giá rồi làm sai lại, quay về bước 1 không hiện lại cảnh báo của lần lưu cũ (L4)", () => {
    render(<CreateCoursePage />);
    fireEvent.change(screen.getByLabelText("Tên khoá học"), { target: { value: "Khoá test" } });
    fireEvent.click(draftButton());
    fireEvent.click(screen.getByRole("button", { name: "Đến bước Cài đặt giá" })); // -> bước 3
    const price = screen.getByPlaceholderText("1200000");
    fireEvent.change(price, { target: { value: "5000" } });
    fireEvent.change(price, { target: { value: "" } });
    fireEvent.click(backButton()); // -> bước 2
    fireEvent.click(backButton()); // -> bước 1
    expect(screen.queryByRole("alert")).toBeNull();
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
