/** Q8-T11: ô "Mô tả ngắn" phải gắn với nhãn của nó (trước đây nhãn không có htmlFor nên textarea chỉ có placeholder). */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/queries/use-categories", () => ({ useCategoryList: () => ({ data: [] }) }));

import { CourseBasicInfoStep } from "./course-basic-info-step";
import type { CourseFormData } from "./course-form-model";

describe("CourseBasicInfoStep — tên truy cập (Q8-T11)", () => {
  it("textarea 'Mô tả ngắn' tìm được theo nhãn", () => {
    const formData = { title: "", short_description: "abc" } as unknown as CourseFormData;
    render(<CourseBasicInfoStep formData={formData} update={vi.fn()} />);
    const field = screen.getByLabelText("Mô tả ngắn") as HTMLTextAreaElement;
    expect(field.tagName).toBe("TEXTAREA");
    expect(field.value).toBe("abc");
  });
});
