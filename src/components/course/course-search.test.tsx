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

const input = () => screen.getByLabelText("Tìm khoá học") as HTMLInputElement;

describe("CourseSearch — đồng bộ với URL", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    currentParams = new URLSearchParams();
    push.mockReset();
    replace.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("điền sẵn từ khoá `q` trên URL khi tải trang", () => {
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

  it("URL đổi thì báo trang cha từ khoá mới (sau 300ms) để danh sách lọc theo", () => {
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

  it("gõ từ khoá: báo trang cha sau 300ms; xoá bằng nút X thì báo rỗng và bỏ `q` khỏi URL", () => {
    const onSearch = vi.fn();
    currentParams = new URLSearchParams("q=react");
    render(<CourseSearch onSearch={onSearch} />);

    fireEvent.change(input(), { target: { value: "reactjs" } });
    act(() => void vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenLastCalledWith("reactjs");

    fireEvent.click(screen.getByRole("button", { name: "Xoá từ khoá tìm kiếm" }));
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

describe("CourseSearch — gợi ý từ backend", () => {
  const suggestions = [
    { id: "c1", title: "Đại số 10", thumbnail: "", instructor: "Nguyễn Văn A", slug: "dai-so-10" },
    { id: "c2", title: "Hình học không gian", thumbnail: "", instructor: "Trần B", slug: "hinh-hoc" },
  ];

  beforeEach(() => {
    currentParams = new URLSearchParams();
    push.mockReset();
    replace.mockReset();
  });

  // Backend tìm không phân biệt dấu (BE2 F-07); client không được lọc lại theo cách nhạy dấu rồi giấu kết quả đúng.
  it('gõ không dấu "dai so" vẫn hiện gợi ý "Đại số 10" mà backend đã trả', () => {
    render(<CourseSearch suggestions={[suggestions[0]]} />);
    fireEvent.change(input(), { target: { value: "dai so" } });
    expect(screen.getByText("Đại số 10")).toBeTruthy();
  });

  it("gợi ý khớp ở trường backend khác (không phải tiêu đề/giảng viên) vẫn hiện", () => {
    render(<CourseSearch suggestions={suggestions} />);
    fireEvent.change(input(), { target: { value: "toan nang cao" } });
    expect(screen.getByText("Đại số 10")).toBeTruthy();
    expect(screen.getByText("Hình học không gian")).toBeTruthy();
  });

  // Gợi ý được tải theo từ khoá đã debounce nên luôn chậm hơn ô nhập: gõ java -> python thì gợi ý của "java"
  // không được hiện dưới "python" trong lúc chờ.
  it("gợi ý của từ khoá cũ (suggestionsQuery khác ô nhập) bị ẩn cho tới khi gợi ý mới về", () => {
    const { rerender } = render(<CourseSearch suggestions={suggestions} suggestionsQuery="java" />);
    fireEvent.change(input(), { target: { value: "java" } });
    expect(screen.getByText("Đại số 10")).toBeTruthy();

    fireEvent.change(input(), { target: { value: "python" } });
    expect(screen.queryByText("Đại số 10")).toBeNull();

    rerender(
      <CourseSearch
        suggestions={[{ ...suggestions[1], title: "Python cơ bản" }]}
        suggestionsQuery="python"
      />
    );
    expect(screen.getByText("Python cơ bản")).toBeTruthy();
  });

  it("dưới 2 ký tự: không hiện gợi ý", () => {
    render(<CourseSearch suggestions={suggestions} />);
    fireEvent.change(input(), { target: { value: "d" } });
    expect(screen.queryByText("Đại số 10")).toBeNull();
  });
});
