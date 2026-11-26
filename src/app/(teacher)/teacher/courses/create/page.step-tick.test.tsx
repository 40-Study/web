/**
 * Q7-T04 (M1): thanh bước tick theo bước ĐÃ HỢP LỆ, không theo vị trí ("step.id < currentStep").
 *
 * Qua đường đi thường (Tiếp tục/Quay lại) bước trước bước hiện tại luôn hợp lệ, nên hai quy tắc cho cùng kết quả và
 * test chuyển bước 1 -> 2 không phân biệt được. Chỉ khi một bước đứng TRƯỚC bước hiện tại mà đã hỏng (dữ liệu bị đổi
 * từ ngoài bước đó) thì hai quy tắc mới khác nhau: bước giả bên dưới xoá mô tả khi đang ở bước 3.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));
vi.mock("@/hooks/queries/use-courses", () => ({
  useCreateCourse: () => ({ mutateAsync: vi.fn(), isPending: false }),
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
vi.mock("../_components/course-pricing-step", () => ({
  CoursePricingStep: ({ update }: { update: (k: "description", v: string) => void }) => (
    <button type="button" onClick={() => update("description", "")}>
      xoá mô tả từ ngoài bước 2
    </button>
  ),
}));

// eslint-disable-next-line import/first
import CreateCoursePage from "./page";

const stepState = (title: string) =>
  screen.getByRole("button", { name: new RegExp(title) }).getAttribute("data-step-state");
const next = () => screen.getAllByRole("button", { name: /Tiếp tục/ })[0];

function reachStep3WithValidStepsBefore() {
  render(<CreateCoursePage />);
  fireEvent.change(screen.getByLabelText("Tên khoá học"), { target: { value: "Khoá test" } });
  fireEvent.click(next()); // -> bước 2
  fireEvent.click(screen.getByRole("button", { name: "có ảnh bìa" }));
  fireEvent.change(screen.getByLabelText("Mô tả chi tiết"), { target: { value: "Mô tả" } });
  fireEvent.click(next()); // -> bước 3
}

describe("wizard tạo khoá — tick thanh bước theo tính hợp lệ (Q7-T04)", () => {
  it("bước 3 là hiện tại, bước 1 và 2 hợp lệ: cả hai được tick", () => {
    reachStep3WithValidStepsBefore();
    expect(stepState("Thông tin cơ bản")).toBe("completed");
    expect(stepState("Hình ảnh & Mô tả")).toBe("completed");
    expect(stepState("Cài đặt giá")).toBe("current");
  });

  it("bước 2 đứng trước bước hiện tại nhưng mất mô tả: không tick (quy tắc theo vị trí vẫn tick)", () => {
    reachStep3WithValidStepsBefore();
    fireEvent.click(screen.getByRole("button", { name: "xoá mô tả từ ngoài bước 2" }));

    expect(stepState("Hình ảnh & Mô tả")).toBe("todo");
    expect(stepState("Thông tin cơ bản")).toBe("completed");
    expect(stepState("Cài đặt giá")).toBe("current");
  });
});
