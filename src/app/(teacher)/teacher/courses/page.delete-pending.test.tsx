/**
 * Re-review PR #79 (Q5): khoá đang chờ duyệt không xoá được (backend 409) — thẻ khoá ở tab
 * "Chờ duyệt" không được hiện nút xoá. Khoá nháp vẫn có nút xoá (đối chứng).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { COURSE_STATUS_LABEL } from "@/types/approval";

const deleteMutate = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({
    data: [
      { id: "c-pending", title: "QA-Khoa cho duyet", status: "pending_review", total_students: 0 },
      { id: "c-draft", title: "QA-Khoa nhap", status: "draft", total_students: 0 },
      ...[1, 2, 3, 4].map((n) => ({
        id: `c-pub-${n}`, title: `QA-Khoa dang ${n}`, status: "published", total_students: 1,
        thumbnail_url: `https://cdn.example.com/c${n}.png`,
      })),
    ],
    isLoading: false,
  }),
  useDeleteCourse: () => ({ mutate: deleteMutate, isPending: false }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCoursesPage from "./page";

function openTab(status: "pending_review" | "draft") {
  fireEvent.click(screen.getByText(new RegExp(`^${COURSE_STATUS_LABEL[status]} \\(1\\)`)));
}

describe("/teacher/courses — nút xoá theo trạng thái", () => {
  it("khoá chờ duyệt: không có nút xoá", () => {
    render(<TeacherCoursesPage />);
    openTab("pending_review");
    expect(screen.getByText("QA-Khoa cho duyet")).toBeTruthy();
    expect(screen.queryByTitle("Xoá khoá học")).toBeNull();
  });

  it("khoá nháp: vẫn có nút xoá", () => {
    render(<TeacherCoursesPage />);
    openTab("draft");
    expect(screen.getByText("QA-Khoa nhap")).toBeTruthy();
    expect(screen.getByTitle("Xoá khoá học")).toBeTruthy();
  });

  // QA-B-05: nút xoá chỉ hiện khi rê chuột (không có trên cảm ứng), xác nhận bằng confirm() của trình duyệt.
  it("khoá nháp: nút xoá luôn hiện, có tên, xác nhận bằng hộp thoại của app rồi mới xoá", () => {
    deleteMutate.mockClear();
    render(<TeacherCoursesPage />);
    openTab("draft");
    const button = screen.getByRole("button", { name: "Xoá khoá học QA-Khoa nhap" });
    expect(button.className).not.toContain("opacity-0");
    fireEvent.click(button);
    expect(deleteMutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xoá khoá học" }));
    expect(deleteMutate).toHaveBeenCalledWith("c-draft", expect.anything());
  });
});

// Q5-T16: ảnh bìa đầu danh sách là LCP -> `priority`; các thẻ phía dưới vẫn lazy.
describe("/teacher/courses — ảnh LCP", () => {
  it("3 thẻ đầu tải ngay (fetchpriority=high), thẻ thứ 4 vẫn lazy", () => {
    render(<TeacherCoursesPage />);
    fireEvent.click(screen.getByText(/^Đã xuất bản \(4\)/));
    const imgs = [1, 2, 3, 4].map((n) => screen.getByAltText(`QA-Khoa dang ${n}`));
    expect(imgs.slice(0, 3).map((i) => i.getAttribute("fetchpriority"))).toEqual(["high", "high", "high"]);
    expect(imgs[3].getAttribute("fetchpriority")).not.toBe("high");
    expect(imgs[3].getAttribute("loading")).toBe("lazy");
  });
});

// Q8-T01 + Q8-T11: ô tìm kiếm có tên truy cập và tìm không dấu, bỏ qua khoảng trắng đầu/cuối.
describe("/teacher/courses — ô tìm kiếm", () => {
  it("'nhap' (không dấu, thừa khoảng trắng) tìm ra khoá có tên 'QA-Khoa nhap'; gõ lạ thì không ra", () => {
    render(<TeacherCoursesPage />);
    openTab("draft");
    const search = screen.getByRole("textbox", { name: "Tìm kiếm khoá học" });
    fireEvent.change(search, { target: { value: "  NHAP " } });
    expect(screen.getByText("QA-Khoa nhap")).toBeTruthy();
    fireEvent.change(search, { target: { value: "khong co" } });
    expect(screen.queryByText("QA-Khoa nhap")).toBeNull();
  });
});
