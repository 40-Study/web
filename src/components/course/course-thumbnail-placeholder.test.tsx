import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseThumbnailPlaceholder } from "./course-thumbnail-placeholder";

describe("CourseThumbnailPlaceholder (F-16)", () => {
  it("là khối nền trung tính (token bg-muted, đổi theo dark mode) + biểu tượng sách giống thẻ khoá học, không phải gradient xanh", () => {
    const { container } = render(<CourseThumbnailPlaceholder />);
    const box = screen.getByTestId("course-thumbnail-placeholder");
    expect(box.className).toContain("bg-muted");
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.innerHTML).not.toContain("gradient");
  });
});
