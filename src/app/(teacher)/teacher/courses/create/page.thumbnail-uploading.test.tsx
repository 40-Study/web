/**
 * QA-B-04: chọn ảnh bìa ở bước 2 rồi đi tiếp và bấm "Tạo khoá" trước khi upload xong thì khoá được tạo với
 * thumbnail_url null. Khi ảnh còn đang tải, nút tạo/lưu nháp phải bị khoá và không gọi API tạo khoá.
 * QA-B-22: bước 4 phải hiện danh mục đã chọn.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

const createCourse = vi.fn();
vi.mock("@/hooks/queries/use-courses", () => ({
  useCreateCourse: () => ({ mutateAsync: createCourse, isPending: false }),
}));
vi.mock("@/hooks/queries/use-categories", () => ({
  useCategoryList: () => ({ data: [{ id: "cat-web", name: "Lập trình Web" }] }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

type Update = (k: string, v: unknown) => void;
vi.mock("../_components/course-basic-info-step", () => ({
  FORMATS: [{ id: "hybrid", label: "Kết hợp" }],
  CourseBasicInfoStep: ({ update }: { update: Update }) => (
    <>
      <input aria-label="Tên khoá học" onChange={(e) => update("title", e.target.value)} />
      <button type="button" onClick={() => update("category_id", "cat-web")}>
        chọn danh mục
      </button>
    </>
  ),
}));

// Bước 2 giả: bấm "bắt đầu tải" để báo đang tải, giữ hàm báo lại để kết thúc upload sau khi bước đã unmount.
let reportUploading: ((uploading: boolean) => void) | undefined;
vi.mock("../_components/course-media-step", () => ({
  CourseMediaStep: ({ onThumbnailUploadingChange }: { onThumbnailUploadingChange?: (u: boolean) => void }) => {
    reportUploading = onThumbnailUploadingChange;
    return (
      <button type="button" onClick={() => onThumbnailUploadingChange?.(true)}>
        bắt đầu tải
      </button>
    );
  },
}));

// eslint-disable-next-line import/first
import CreateCoursePage from "./page";

const next = () => screen.getAllByRole("button", { name: /Tiếp tục/ })[0] as HTMLButtonElement;
const createButtons = () =>
  screen.getAllByRole("button", { name: /Tạo khoá & thêm bài học/ }) as HTMLButtonElement[];

function reachStep4WithUploadInFlight() {
  render(<CreateCoursePage />);
  fireEvent.change(screen.getByLabelText("Tên khoá học"), { target: { value: "Khoá test" } });
  fireEvent.click(screen.getByRole("button", { name: "chọn danh mục" }));
  fireEvent.click(next()); // -> bước 2
  fireEvent.click(screen.getByRole("button", { name: "bắt đầu tải" }));
  fireEvent.click(next()); // -> bước 3 (bước 2 unmount, upload vẫn chạy)
  fireEvent.click(screen.getByRole("button", { name: /Miễn phí/ }));
  fireEvent.click(next()); // -> bước 4
}

describe("wizard tạo khoá — ảnh bìa đang tải (QA-B-04)", () => {
  beforeEach(() => {
    createCourse.mockReset().mockResolvedValue({ id: "course-new" });
    reportUploading = undefined;
  });

  it("khoá nút tạo và lưu nháp khi ảnh bìa đang tải, không gọi API", () => {
    reachStep4WithUploadInFlight();
    expect(screen.getByRole("status").textContent).toContain("Đang tải ảnh bìa lên");
    createButtons().forEach((b) => expect(b.disabled).toBe(true));
    screen.getAllByRole("button", { name: "Lưu nháp" }).forEach((b) => {
      expect((b as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(b);
    });
    expect(createCourse).not.toHaveBeenCalled();
  });

  it("mở lại nút khi upload xong, kể cả lúc bước 2 đã đóng", () => {
    reachStep4WithUploadInFlight();
    act(() => reportUploading?.(false));
    createButtons().forEach((b) => expect(b.disabled).toBe(false));
  });

  it("bước 4 hiện danh mục đã chọn (QA-B-22)", () => {
    reachStep4WithUploadInFlight();
    expect(screen.getByText("Danh mục:").parentElement?.textContent).toContain("Lập trình Web");
  });
});
