import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseThumbnailPlaceholder } from "./course-thumbnail-placeholder";

describe("CourseThumbnailPlaceholder (F-16)", () => {
  it("là khối nền slate + biểu tượng sách giống thẻ khoá học, không phải gradient xanh", () => {
    const { container } = render(<CourseThumbnailPlaceholder />);
    const box = screen.getByTestId("course-thumbnail-placeholder");
    expect(box.className).toContain("bg-slate-100");
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.innerHTML).not.toContain("gradient");
  });
});
