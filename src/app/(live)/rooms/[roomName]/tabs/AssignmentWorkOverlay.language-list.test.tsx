import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Q5-T11 (M2): giảng viên giờ lưu được bài tập với `language: []` (mảng rỗng = không giới hạn ngôn ngữ). Danh sách ngôn ngữ
 * trong phòng live từng lọc bằng `!language || ...` nên `[]` (truthy) cho ra <select> rỗng trong khi state vẫn giữ 'python'.
 */
const language = vi.hoisted(() => ({ value: [] as string[] | undefined }));

vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/components/meet/RichTextEditor", () => ({
  default: () => null,
  RichTextViewer: ({ content }: { content: string }) => <span>{content}</span>,
}));
vi.mock("@/lib/meet/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/meet/api")>("@/lib/meet/api");
  return {
    ...actual,
    api: {
      get: vi.fn(async (path: string) => {
        if (path.includes("/sandbox"))
          return {
            assignment: { id: "a1", title: "T", description: "Đề", starter_code: "print(1)", language: language.value },
            sample_tests: [],
          };
        return { data: [] };
      }),
      post: vi.fn(),
    },
  };
});

import AssignmentWorkOverlay from "./AssignmentWorkOverlay";

async function languageOptions(): Promise<string[]> {
  render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);
  const select = (await screen.findByRole("combobox")) as HTMLSelectElement;
  return Array.from(select.options).map((o) => o.value);
}

describe("AssignmentWorkOverlay — danh sách ngôn ngữ", () => {
  it("language rỗng ([]) = không giới hạn: <select> liệt kê đủ ngôn ngữ và mặc định là python", async () => {
    language.value = [];
    const options = await languageOptions();
    expect(options.length).toBeGreaterThan(1);
    expect(options).toContain("python");
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("python");
  });

  it("language không có (undefined) = không giới hạn: liệt kê đủ ngôn ngữ", async () => {
    language.value = undefined;
    expect((await languageOptions()).length).toBeGreaterThan(1);
  });

  it("language có giới hạn (['go']) vẫn chỉ liệt kê ngôn ngữ được phép", async () => {
    language.value = ["go"];
    expect(await languageOptions()).toEqual(["go"]);
  });
});
