/** QA-B-05: trang chi tiết khoá có nút xoá bản nháp, xác nhận bằng hộp thoại rồi về danh sách khoá. */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const mutate = vi.fn();
vi.mock("@/hooks/queries/use-courses", () => ({ useDeleteCourse: () => ({ mutate, isPending: false }) }));

// eslint-disable-next-line import/first
import { DeleteDraftCourseButton } from "./delete-draft-course-button";

beforeEach(() => {
  push.mockClear();
  mutate.mockReset().mockImplementation((_id: string, opts: { onSuccess?: () => void }) => opts.onSuccess?.());
});

describe("DeleteDraftCourseButton", () => {
  it("bản nháp: xác nhận rồi xoá và về danh sách khoá", () => {
    render(<DeleteDraftCourseButton courseId="c1" title="QA nháp" status="draft" />);
    fireEvent.click(screen.getByRole("button", { name: /Xoá bản nháp/ }));
    expect(mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xoá khoá học" }));
    expect(mutate).toHaveBeenCalledWith("c1", expect.anything());
    expect(push).toHaveBeenCalledWith("/teacher/courses");
  });

  it("khoá không phải nháp: không hiện nút", () => {
    render(<DeleteDraftCourseButton courseId="c1" title="Khoá bán" status="published" />);
    expect(screen.queryByRole("button", { name: /Xoá bản nháp/ })).toBeNull();
  });
});
