import { describe, expect, it } from "vitest";
import { pickContinueCourse } from "./continue-course";

const c = (id: string, progress: number, lastAccessedAt?: string, enrolledAt = "2026-10-01T00:00:00Z") => ({
  id,
  progress,
  lastAccessedAt,
  enrolledAt,
});

describe("pickContinueCourse (QA3 Q9: /home và /my-courses chọn khác khoá)", () => {
  const same = "2026-11-04T05:00:00Z";

  it("cùng last_accessed_at: ưu tiên khoá đã học (progress>0) dù đứng sau trong mảng", () => {
    const list = [c("flutter", 0, same), c("react", 55, same)];
    expect(pickContinueCourse(list)?.id).toBe("react");
  });

  it("kết quả không phụ thuộc thứ tự mảng đầu vào", () => {
    const a = c("a", 20, same);
    const b = c("b", 20, same);
    expect(pickContinueCourse([a, b])?.id).toBe(pickContinueCourse([b, a])?.id);
  });

  it("truy cập gần nhất thắng", () => {
    const list = [c("old", 80, "2026-11-01T00:00:00Z"), c("new", 10, "2026-11-03T00:00:00Z")];
    expect(pickContinueCourse(list)?.id).toBe("new");
  });

  it("bỏ qua khoá đã hoàn thành", () => {
    expect(pickContinueCourse([c("done", 100, same), c("wip", 30, "2026-10-01T00:00:00Z")])?.id).toBe("wip");
  });

  it("chưa khoá nào bắt đầu thì lấy khoá chưa học gần nhất; xong hết thì undefined", () => {
    expect(pickContinueCourse([c("x", 0, "2026-11-01T00:00:00Z"), c("y", 0, "2026-11-02T00:00:00Z")])?.id).toBe("y");
    expect(pickContinueCourse([c("done", 100, same)])).toBeUndefined();
    expect(pickContinueCourse([])).toBeUndefined();
  });

  it("thiếu last_accessed_at xếp sau khoá có truy cập", () => {
    expect(pickContinueCourse([c("none", 40), c("seen", 40, same)])?.id).toBe("seen");
  });
});
