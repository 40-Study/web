/**
 * Lane U (UX-6): ô tìm kiếm ở /courses phải đồng bộ với `?q=` trên URL — điền sẵn khi tải trang và
 * cập nhật khi back/forward. Trước đây `useState("")` bỏ qua URL nên vào /courses?q=react ô trống.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let currentParams = new URLSearchParams();
const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => currentParams,
}));

// eslint-disable-next-line import/first
import { CourseSearch } from "./course-search";

const input = () => screen.getByLabelText("Tìm khóa học") as HTMLInputElement;

describe("CourseSearch — đồng bộ với URL", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    currentParams = new URLSearchParams();
    push.mockReset();
    replace.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("điền sẵn từ khóa `q` trên URL khi tải trang", () => {
    currentParams = new URLSearchParams("q=react");
    render(<CourseSearch />);
    expect(input().value).toBe("react");
  });

  it("URL đổi (back/forward) thì ô cập nhật theo, kể cả về rỗng", () => {
    currentParams = new URLSearchParams("q=react");
    const { rerender } = render(<CourseSearch />);

    currentParams = new URLSearchParams("q=python");
    rerender(<CourseSearch />);
    expect(input().value).toBe("python");

    currentParams = new URLSearchParams();
    rerender(<CourseSearch />);
    expect(input().value).toBe("");
  });

  it("URL đổi thì báo trang cha từ khóa mới (sau 300ms) để danh sách lọc theo", () => {
    const onSearch = vi.fn();
    currentParams = new URLSearchParams("q=react");
    const { rerender } = render(<CourseSearch onSearch={onSearch} />);
    expect(onSearch).not.toHaveBeenCalled(); // trang cha đã khởi tạo từ chính URL này

    currentParams = new URLSearchParams("q=python");
    rerender(<CourseSearch onSearch={onSearch} />);
    act(() => void vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenCalledWith("python");

    currentParams = new URLSearchParams();
    rerender(<CourseSearch onSearch={onSearch} />);
    act(() => void vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenLastCalledWith("");
  });

  it("gõ từ khóa: báo trang cha sau 300ms; xoá bằng nút X thì báo rỗng và bỏ `q` khỏi URL", () => {
    const onSearch = vi.fn();
    currentParams = new URLSearchParams("q=react");
    render(<CourseSearch onSearch={onSearch} />);

    fireEvent.change(input(), { target: { value: "reactjs" } });
    act(() => void vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenLastCalledWith("reactjs");

    fireEvent.click(screen.getByRole("button", { name: "Xóa từ khóa tìm kiếm" }));
    act(() => void vi.advanceTimersByTime(300));
    expect(input().value).toBe("");
    expect(onSearch).toHaveBeenLastCalledWith("");
    expect(replace).toHaveBeenCalledWith("/courses");
  });

  it("Enter điều hướng tới /courses?q=...", () => {
    render(<CourseSearch />);
    fireEvent.change(input(), { target: { value: "lập trình" } });
    fireEvent.submit(input().closest("form") as HTMLFormElement);
    expect(push).toHaveBeenCalledWith("/courses?q=" + encodeURIComponent("lập trình"));
  });
});
