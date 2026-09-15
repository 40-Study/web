/**
 * Test luật khoá tuần tự + microcopy (contract §2, bước 9).
 */

import { describe, expect, it } from "vitest";
import {
  canOpenLesson,
  describeLock,
  findNextLesson,
  findPreviousLesson,
  flattenLessons,
  LOCKED_FALLBACK_MESSAGE,
  LOCK_REASON_MESSAGE,
  normalizeLockReason,
  resolveResumeSeconds,
} from "./lesson-lock";
import type { PlayerCourse, PlayerLesson } from "@/types/course-player";

function lesson(partial: Partial<PlayerLesson> & { id: string }): PlayerLesson {
  return {
    title: partial.id,
    duration: "10:00",
    type: "video",
    completed: false,
    locked: false,
    ...partial,
  };
}

const course: Pick<PlayerCourse, "chapters"> = {
  chapters: [
    { id: "ch-1", title: "Chương 1", lessons: [lesson({ id: "l1" }), lesson({ id: "l2" })] },
    { id: "ch-2", title: "Chương 2", lessons: [lesson({ id: "l3" })] },
  ],
};

describe("normalizeLockReason", () => {
  it("giữ hai lý do đã biết", () => {
    expect(normalizeLockReason("previous_incomplete")).toBe("previous_incomplete");
    expect(normalizeLockReason("not_enrolled")).toBe("not_enrolled");
  });

  it("null và chuỗi lạ → null", () => {
    expect(normalizeLockReason(null)).toBeNull();
    expect(normalizeLockReason(undefined)).toBeNull();
    expect(normalizeLockReason("ly-do-moi-tu-backend")).toBeNull();
  });
});

describe("describeLock", () => {
  it("bài mở → không có thông báo", () => {
    expect(describeLock({ locked: false, lockReason: null })).toBeNull();
  });

  it("mỗi lý do có câu riêng, không dùng chung", () => {
    expect(describeLock({ locked: true, lockReason: "previous_incomplete" })).toBe(
      "Vui lòng hoàn thành bài học hiện tại"
    );
    expect(describeLock({ locked: true, lockReason: "not_enrolled" })).toBe(
      "Bạn cần tham gia khoá học để mở bài này"
    );
    expect(LOCK_REASON_MESSAGE.previous_incomplete).not.toBe(LOCK_REASON_MESSAGE.not_enrolled);
    expect(LOCK_REASON_MESSAGE.not_enrolled).not.toBe(LOCKED_FALLBACK_MESSAGE);
  });

  it("khoá mà thiếu lý do → vẫn có câu, không trả null", () => {
    expect(describeLock({ locked: true, lockReason: null })).toBe(
      "Vui lòng hoàn thành bài học hiện tại"
    );
  });
});

describe("canOpenLesson", () => {
  it("bài chưa khoá mở được", () => {
    expect(canOpenLesson({ locked: false })).toBe(true);
  });

  it("bài bị khoá thì không", () => {
    expect(canOpenLesson({ locked: true })).toBe(false);
  });
});

describe("flattenLessons / điều hướng", () => {
  it("duyệt đúng thứ tự chương rồi bài", () => {
    expect(flattenLessons(course).map((l) => l.id)).toEqual(["l1", "l2", "l3"]);
  });

  it("bài kế tiếp vượt qua ranh giới chương", () => {
    expect(findNextLesson(course, "l2")?.id).toBe("l3");
  });

  it("bài cuối không có bài kế tiếp", () => {
    expect(findNextLesson(course, "l3")).toBeUndefined();
  });

  it("bài trước đó vượt qua ranh giới chương", () => {
    expect(findPreviousLesson(course, "l3")?.id).toBe("l2");
  });

  it("bài đầu không có bài trước", () => {
    expect(findPreviousLesson(course, "l1")).toBeUndefined();
  });
});

describe("resolveResumeSeconds", () => {
  it("thiếu dữ liệu → bắt đầu từ 0", () => {
    expect(resolveResumeSeconds(null)).toBe(0);
    expect(resolveResumeSeconds(undefined)).toBe(0);
    expect(resolveResumeSeconds(0)).toBe(0);
  });

  it("resume đúng vị trí đã lưu", () => {
    expect(resolveResumeSeconds(754)).toBe(754);
  });

  it("đã xem >=95% mà chưa completed → quay về đầu", () => {
    expect(resolveResumeSeconds(595, 600)).toBe(0);
  });

  // Ca biên cho ngưỡng 0.95 (review vòng 1, #13): test rỗng ở ngưỡng resume —
  // đổi 0.95 thành 0.5 mà cả bộ test vẫn xanh vì không có ca nào quanh 95%.
  it("94% — dưới ngưỡng, giữ nguyên vị trí đã lưu", () => {
    expect(resolveResumeSeconds(564, 600)).toBe(564);
  });

  it("đúng ngưỡng 95% — quay về đầu (bao gồm biên)", () => {
    expect(resolveResumeSeconds(570, 600)).toBe(0);
  });

  it("96% — trên ngưỡng, quay về đầu", () => {
    expect(resolveResumeSeconds(576, 600)).toBe(0);
  });

  it("kẹp vị trí vào thời lượng video", () => {
    expect(resolveResumeSeconds(5000, 600)).toBe(600);
  });

  it("dữ liệu rác (NaN) → 0, không làm vỡ player", () => {
    expect(resolveResumeSeconds(Number.NaN)).toBe(0);
  });
});
