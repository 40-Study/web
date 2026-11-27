/**
 * Q10 #148 H1: tab Khoá học / Bài tập của phụ huynh còn cache mà refetch nền lỗi: giữ nội dung + thông báo 'Thử lại'
 * (trước đây im lặng). `showStaleNotice={false}` nhường cho notice cấp trang. Lần tải đầu lỗi vẫn là hộp lỗi.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChildAssignmentsResponse } from "@/services/parent-dashboard.service";
import { ChildAssignmentsTab } from "./child-assignments-tab";
import { ChildCoursesTab } from "./child-courses-tab";

vi.mock("@/hooks/queries/use-conversations", () => ({ useCreateDirectConversation: () => ({ mutate: vi.fn(), isPending: false }) }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}));

const courses = [{ id: "k1", course_name: "Khoá Toán", progress_percent: 40 }] as never;
const assignments = { assignments: [], stats: undefined, total: 0, page: 1, page_size: 20 } as unknown as ChildAssignmentsResponse;

describe("ChildCoursesTab — refetch lỗi mà còn cache (Q10 #148)", () => {
  it("giữ khoá học + thông báo 'Thử lại', không hộp lỗi", () => {
    const onRetry = vi.fn();
    render(<ChildCoursesTab courses={courses} isLoading={false} isError onRetry={onRetry} />);
    expect(screen.getByText("Khoá Toán")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được danh sách khoá học");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("danh sách RỖNG đã cache + lỗi: 'Chưa đăng ký' + thông báo", () => {
    render(<ChildCoursesTab courses={[]} isLoading={false} isError onRetry={vi.fn()} />);
    expect(screen.getByText("Chưa đăng ký khoá học nào")).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("showStaleNotice={false}: giữ nội dung, không tự báo; chưa có data vẫn là hộp lỗi", () => {
    const { unmount } = render(<ChildCoursesTab courses={courses} isLoading={false} isError onRetry={vi.fn()} showStaleNotice={false} />);
    expect(screen.getByText("Khoá Toán")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
    render(<ChildCoursesTab courses={undefined} isLoading={false} isError onRetry={vi.fn()} showStaleNotice={false} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});

describe("ChildAssignmentsTab — refetch lỗi mà còn cache (Q10 #148)", () => {
  it("giữ nội dung + thông báo 'Thử lại'", () => {
    const onRetry = vi.fn();
    render(<ChildAssignmentsTab data={assignments} isLoading={false} isError onRetry={onRetry} />);
    expect(screen.getByText("Chưa có bài tập nào")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được danh sách bài tập");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("showStaleNotice={false} nhường cho notice cấp trang; không lỗi thì không có thông báo", () => {
    const { unmount } = render(
      <ChildAssignmentsTab data={assignments} isLoading={false} isError onRetry={vi.fn()} showStaleNotice={false} />
    );
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
    render(<ChildAssignmentsTab data={assignments} isLoading={false} onRetry={vi.fn()} />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
