/**
 * Review đối kháng web PR #27 (MAJOR): select.tsx dùng ở 18 nơi trong toàn app nhưng không có
 * test tự động nào — nếu ai đó sau này vô tình đổi lại `SelectValue` về in thẳng `value` thô
 * (bug gốc P2/P3 QA 260927 teacher: "all"/"MIXED" hiện raw thay vì nhãn tiếng Việt, và giá trị
 * rỗng "" làm ô "Danh mục" trống trơn lúc tạo khóa học vì `label ?? value ?? placeholder` không
 * rơi về placeholder khi value là "" — "" không phải null/undefined nên "??" dừng lại ở đó),
 * suite hiện tại vẫn xanh 100% vì không file nào chạm tới component này.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

function renderSelect(value: string) {
  return render(
    <Select value={value} onValueChange={() => {}}>
      <SelectTrigger>
        <SelectValue placeholder="Chọn trình độ" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tất cả trình độ</SelectItem>
        <SelectItem value="MIXED">Hỗn hợp</SelectItem>
        <SelectItem value="beginner">Cơ bản</SelectItem>
      </SelectContent>
    </Select>
  );
}

describe("Select — SelectValue hiển thị nhãn (review đối kháng PR #27)", () => {
  it("value rỗng ('') hiện placeholder, KHÔNG hiện trống trơn hay raw value", () => {
    renderSelect("");
    expect(screen.getByText("Chọn trình độ")).toBeTruthy();
  });

  it("value = 'all' hiện nhãn tiếng Việt đã đăng ký, KHÔNG hiện raw enum 'all'", () => {
    renderSelect("all");
    // Nhãn tiếng Việt phải xuất hiện — ít nhất 1 lần (trigger); không assert count vì
    // SelectItem trong dropdown (ẩn bằng class "hidden", không unmount) cũng chứa cùng text.
    expect(screen.getAllByText("Tất cả trình độ").length).toBeGreaterThan(0);
    // Raw value "all" không được xuất hiện như text độc lập ngoài nhãn đã đăng ký.
    expect(screen.queryByText("all", { selector: "span" })).toBeNull();
  });

  it("value = 'MIXED' hiện nhãn tiếng Việt, KHÔNG hiện raw enum 'MIXED'", () => {
    renderSelect("MIXED");
    expect(screen.getAllByText("Hỗn hợp").length).toBeGreaterThan(0);
    expect(screen.queryByText("MIXED", { selector: "span" })).toBeNull();
  });
});
