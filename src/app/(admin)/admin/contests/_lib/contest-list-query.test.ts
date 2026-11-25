import { describe, expect, it } from "vitest";
import { parseContestPage, parseContestStatus, parseContestTab, patchContestQuery } from "./contest-list-query";

describe("contest-list-query (QA7-A08)", () => {
  it("tab: chỉ 'all' là Tất cả, mọi giá trị khác rơi về Chờ duyệt", () => {
    expect(parseContestTab("all")).toBe("all");
    expect(parseContestTab("pending")).toBe("pending");
    expect(parseContestTab("nope")).toBe("pending");
    expect(parseContestTab(null)).toBe("pending");
  });
  it("status: chỉ nhận trạng thái cuộc thi hợp lệ", () => {
    expect(parseContestStatus("PUBLISHED")).toBe("PUBLISHED");
    expect(parseContestStatus("nope")).toBe("");
    expect(parseContestStatus(null)).toBe("");
  });
  it("page: số nguyên >= 1, còn lại về 1", () => {
    expect(parseContestPage("3")).toBe(3);
    expect(parseContestPage("0")).toBe(1);
    expect(parseContestPage("-2")).toBe(1);
    expect(parseContestPage("1.5")).toBe(1);
    expect(parseContestPage("abc")).toBe(1);
    expect(parseContestPage(null)).toBe(1);
  });
  it("patch: giá trị mặc định (tab pending, page 1, rỗng/null) xoá khoá; còn lại ghi ra", () => {
    expect(patchContestQuery("", { tab: "all" })).toBe("tab=all");
    expect(patchContestQuery("tab=all&status=PUBLISHED&page=3", { tab: "pending", status: null, page: null })).toBe("");
    expect(patchContestQuery("tab=all&page=3", { page: 1 })).toBe("tab=all");
    expect(patchContestQuery("tab=all", { q: "toán", page: null })).toBe("tab=all&q=to%C3%A1n");
    expect(patchContestQuery("q=abc", { q: "" })).toBe("");
  });
});
