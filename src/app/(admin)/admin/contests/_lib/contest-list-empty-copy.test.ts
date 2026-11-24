import { describe, expect, it } from "vitest";
import { contestListEmptyCopy } from "./contest-list-empty-copy";

describe("contestListEmptyCopy (QA4-A06)", () => {
  it("có từ khoá: nói rõ không khớp từ khoá, kể cả ở tab Chờ duyệt", () => {
    expect(contestListEmptyCopy("pending", "  vong loai ")).toEqual({
      title: "Không có cuộc thi khớp “vong loai”",
      description: "Thử từ khoá khác hoặc xoá ô tìm kiếm.",
    });
  });

  it("không có từ khoá: giữ lời theo tab", () => {
    expect(contestListEmptyCopy("pending", "").description).toBe("Hiện không có cuộc thi nào chờ duyệt.");
    expect(contestListEmptyCopy("all", "   ").description).toBe("Không có cuộc thi khớp bộ lọc hiện tại.");
  });
});
