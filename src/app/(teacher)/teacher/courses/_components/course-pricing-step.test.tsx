/**
 * Q7-T02/T03 qua ô nhập thật: ô giá là type="number" thì trình duyệt đọc "1e", "-", "2." thành "" — giá báo nhầm
 * "hãy nhập giá", giá khuyến mãi bị coi là trống (lưu im lặng không khuyến mãi). Ô là text nên chuỗi gõ tới được bộ kiểm.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { CoursePricingStep } from "./course-pricing-step";
import { initialCourseFormData, type CourseFormData } from "./course-form-model";

function Harness({ start }: { start?: Partial<CourseFormData> }) {
  const [form, setForm] = useState<CourseFormData>({ ...initialCourseFormData, is_free: false, ...start });
  return <CoursePricingStep formData={form} update={(k, v) => setForm((f) => ({ ...f, [k]: v }))} />;
}

const priceInput = () => screen.getByPlaceholderText("1200000") as HTMLInputElement;
const saleInput = () => screen.getByPlaceholderText("890000") as HTMLInputElement;
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

describe("CoursePricingStep — nhập giá qua ô (Q7-T02/T03)", () => {
  it("ô giá là text + inputMode numeric (không phải number)", () => {
    render(<Harness />);
    for (const el of [priceInput(), saleInput()]) {
      expect(el.type).toBe("text");
      expect(el.inputMode).toBe("numeric");
    }
  });

  it.each(["1e", "-", "2.", "1.5", "abc"])("giá khuyến mãi %s: hiện lỗi tại ô, giữ nguyên chuỗi đã gõ", (value) => {
    render(<Harness start={{ price: "500000" }} />);
    type(saleInput(), value);
    expect(saleInput().value).toBe(value);
    expect(saleInput().getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toMatch(/Giá khuyến mãi phải|Giá phải là số/);
  });

  it.each(["1e", "2.", "1.5", "abc"])("giá bán %s: hiện lỗi tại ô, giữ nguyên chuỗi đã gõ", (value) => {
    render(<Harness />);
    type(priceInput(), value);
    expect(priceInput().value).toBe(value);
    expect(priceInput().getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBeTruthy();
  });

  it("giá bán '2.' báo sai định dạng (không phải 'hãy nhập giá')", () => {
    render(<Harness />);
    type(priceInput(), "2.");
    expect(screen.getByRole("alert").textContent).toContain("số tiền VNĐ nguyên");
  });

  it("số nguyên hợp lệ: không lỗi; ô khuyến mãi để trống: không lỗi", () => {
    render(<Harness start={{ price: "500000" }} />);
    type(saleInput(), "300000");
    expect(screen.queryByRole("alert")).toBeNull();
    type(saleInput(), "");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
