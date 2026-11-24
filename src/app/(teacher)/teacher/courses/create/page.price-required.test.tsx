/**
 * QA3 Q3-09 / Q3-23: bước "Cài đặt giá" của wizard tạo khoá. "Có phí" mà không có giá > 0 từng đi qua
 * (parseFloat("") || 0 -> khoá có phí giá 0đ). Giờ phải chặn "Tiếp tục" kèm lý do ngay dưới ô giá, và
 * "Tất cả trình độ" phải gửi all_levels (không phải beginner).
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }) }));

const createCourse = vi.fn();
vi.mock("@/hooks/queries/use-courses", () => ({
  useCreateCourse: () => ({ mutateAsync: createCourse, isPending: false }),
}));
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

const next = () => screen.getAllByRole("button", { name: /Tiếp tục/ })[0] as HTMLButtonElement;

function goToPricingStep() {
  render(<CreateCoursePage />);
  fireEvent.change(screen.getByLabelText("Tên khoá học"), { target: { value: "Khoá test" } });
  fireEvent.click(next()); // -> bước 2
  fillMedia();
  fireEvent.click(next()); // -> bước 3
  expect(screen.getByRole("heading", { name: "Cài đặt giá" })).toBeTruthy();
}

function fillMedia() {
  fireEvent.click(screen.getByRole("button", { name: "có ảnh bìa" }));
  fireEvent.change(screen.getByLabelText("Mô tả chi tiết"), { target: { value: "Mô tả" } });
}

describe("wizard tạo khoá — giá bán (Q3-09)", () => {
  beforeEach(() => {
    createCourse.mockReset().mockResolvedValue({ id: "course-new" });
    push.mockClear();
  });

  it("'Có phí' mặc định, giá trống: hiện lý do dưới ô giá và khoá nút Tiếp tục", () => {
    goToPricingStep();
    expect(screen.getByRole("alert").textContent).toContain("Vui lòng nhập giá bán lớn hơn 0 hoặc chọn Miễn phí.");
    expect(next().disabled).toBe(true);
  });

  it("nhập giá > 0 thì mở nút Tiếp tục", () => {
    goToPricingStep();
    fireEvent.change(screen.getByPlaceholderText("1200000"), { target: { value: "500000" } });
    expect(next().disabled).toBe(false);
  });

  it("chọn Miễn phí thì không cần giá", () => {
    goToPricingStep();
    fireEvent.click(screen.getByRole("button", { name: /Miễn phí/ }));
    expect(next().disabled).toBe(false);
  });

  it("'Lưu nháp' khi chưa có giá: không tạo khoá, quay về bước giá", async () => {
    goToPricingStep();
    fireEvent.click(screen.getAllByRole("button", { name: "Lưu nháp" })[0]);
    expect(createCourse).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Cài đặt giá" })).toBeTruthy();
  });

  it("'Tất cả trình độ' gửi level all_levels (Q3-23), giá gửi đúng số đã nhập", async () => {
    goToPricingStep();
    fireEvent.change(screen.getByPlaceholderText("1200000"), { target: { value: "500000" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Lưu nháp" })[0]);
    await waitFor(() => expect(createCourse).toHaveBeenCalledTimes(1));
    expect(createCourse.mock.calls[0][0]).toMatchObject({ level: "all_levels", price: 500000, is_free: false });
  });
});

describe("wizard tạo khoá — bước ảnh bìa & mô tả (Q4-T14)", () => {
  function goToMediaStep() {
    render(<CreateCoursePage />);
    fireEvent.change(screen.getByLabelText("Tên khoá học"), { target: { value: "Khoá test" } });
    fireEvent.click(next());
  }

  it("thiếu ảnh bìa và mô tả: khoá Tiếp tục và nói rõ thiếu gì", () => {
    goToMediaStep();
    expect(next().disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("ảnh bìa và mô tả chi tiết");
  });

  it("chỉ thiếu mô tả: vẫn khoá, chỉ nhắc mô tả", () => {
    goToMediaStep();
    fireEvent.click(screen.getByRole("button", { name: "có ảnh bìa" }));
    expect(next().disabled).toBe(true);
    expect(screen.getByRole("status").textContent).not.toContain("ảnh bìa");
  });

  it("đủ ảnh bìa và mô tả thì mở Tiếp tục", () => {
    goToMediaStep();
    fillMedia();
    expect(next().disabled).toBe(false);
  });
});
