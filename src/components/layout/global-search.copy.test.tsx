/** QA5 S5-16: ô tìm kiếm chỉ tìm khoá học (courseService.searchCourses) nên placeholder không hứa "bài tập, hỏi đáp". */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/services/course.service", () => ({ courseService: { searchCourses: vi.fn().mockResolvedValue([]) } }));

import { GlobalSearch } from "./global-search";

describe("GlobalSearch — nội dung gợi ý", () => {
  it("placeholder và nhãn nói đúng phạm vi: chỉ khoá học", () => {
    render(<GlobalSearch />);
    const input = screen.getByRole("textbox", { name: "Tìm khoá học" });
    expect(input.getAttribute("placeholder")).toBe("Tìm khoá học...");
    expect(document.body.textContent).not.toMatch(/bài tập|hỏi đáp/);
  });
});
