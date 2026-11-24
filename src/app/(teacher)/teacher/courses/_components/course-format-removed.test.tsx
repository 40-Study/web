/**
 * Q4-T04 / Q4-T05: "Định dạng giảng dạy" (Video/Livestream/Kết hợp) và "Khoá học nổi bật" không có trường backend
 * nên lựa chọn bị bỏ âm thầm (mọi thẻ khoá ghi VIDEO, bộ lọc Livestream/Kết hợp luôn rỗng). Đã gỡ khỏi wizard và danh
 * sách khoá.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/queries/use-categories", () => ({ useCategoryList: () => ({ data: [] }) }));
vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({
    data: [{ id: "c1", title: "Khoá A", status: "published", total_students: 3, price: 100000 }],
    isLoading: false,
  }),
  useDeleteCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// eslint-disable-next-line import/first
import { CourseBasicInfoStep } from "./course-basic-info-step";
// eslint-disable-next-line import/first
import { CoursePricingStep } from "./course-pricing-step";
// eslint-disable-next-line import/first
import { initialCourseFormData } from "./course-form-model";
// eslint-disable-next-line import/first
import TeacherCoursesPage from "../page";

describe("bỏ định dạng giảng dạy và công tắc nổi bật", () => {
  it("bước Thông tin cơ bản không còn ô chọn định dạng", () => {
    render(<CourseBasicInfoStep formData={initialCourseFormData} update={vi.fn()} />);
    expect(screen.queryByText(/Định dạng giảng dạy/)).toBeNull();
    expect(screen.queryByText("Livestream")).toBeNull();
    expect(screen.queryByText(/Zoom\/Meet/)).toBeNull();
  });

  it("bước Cài đặt giá không còn công tắc Khoá học nổi bật", () => {
    render(<CoursePricingStep formData={initialCourseFormData} update={vi.fn()} />);
    expect(screen.queryByText("Khoá học nổi bật")).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("danh sách khoá không còn huy hiệu VIDEO và bộ lọc định dạng", () => {
    render(<TeacherCoursesPage />);
    expect(screen.getByText("Khoá A")).toBeTruthy();
    expect(screen.queryByText("VIDEO")).toBeNull();
    expect(screen.queryByText("Tất cả định dạng")).toBeNull();
  });
});
