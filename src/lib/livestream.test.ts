/**
 * Phase 0 review — finding #1 (không tự lấy lớp đầu tiên) và #2 (không mất
 * field im lặng); vòng 3 — M-1 (gắn buổi live vào lesson_content) và M-5
 * (bỏ `host_id` đã chết ở backend).
 *
 * Test thuần logic, không render: nguồn sự thật cho luật chọn lớp, cho payload
 * gửi lên `POST /livestream` (`dto.CreateLivestreamDTO`), và cho thứ tự gọi API
 * của `submitLivestreamContent`.
 */

import { describe, expect, it, vi } from "vitest";
import {
  buildLivestreamCreatePayload,
  buildScheduledAt,
  requiresClassSelection,
  resolveLivestreamClassId,
  submitLivestreamContent,
} from "./livestream";
import type { LivestreamSubmitDeps } from "./livestream";

const CLASSES = [
  { id: "class-a", name: "Lớp A" },
  { id: "class-b", name: "Lớp B" },
];

const CTX = { courseId: "course-1" };
const FORM = { title: "Q&A tuần 3", description: "Hỏi đáp", date: "2026-10-01", startTime: "20:00" };

// ─── Chọn lớp: 0 / 1 / ≥2 ───────────────────────────────────────────────────

describe("resolveLivestreamClassId — chọn lớp cho buổi live", () => {
  it("0 lớp → null (không thể tạo buổi live)", () => {
    expect(resolveLivestreamClassId([], null)).toBeNull();
    expect(resolveLivestreamClassId([], "class-a")).toBeNull();
  });

  it("1 lớp → tự dùng lớp đó, không cần giáo viên chọn", () => {
    expect(resolveLivestreamClassId([CLASSES[0]], null)).toBe("class-a");
    // Lựa chọn cũ còn sót lại cũng không ghi đè lớp duy nhất.
    expect(resolveLivestreamClassId([CLASSES[0]], "class-b")).toBe("class-a");
  });

  it("≥2 lớp + chưa chọn → null (chặn gửi)", () => {
    expect(resolveLivestreamClassId(CLASSES, null)).toBeNull();
    expect(resolveLivestreamClassId(CLASSES, "")).toBeNull();
    expect(resolveLivestreamClassId(CLASSES, undefined)).toBeNull();
  });

  it("≥2 lớp + đã chọn → trả đúng lớp đã chọn", () => {
    expect(resolveLivestreamClassId(CLASSES, "class-b")).toBe("class-b");
  });

  it("≥2 lớp + id không thuộc khoá này → null (không gửi id lạ lên backend)", () => {
    expect(resolveLivestreamClassId(CLASSES, "class-cua-khoa-khac")).toBeNull();
  });
});

describe("requiresClassSelection", () => {
  it("chỉ bắt buộc chọn lớp từ 2 lớp trở lên", () => {
    expect(requiresClassSelection(0)).toBe(false);
    expect(requiresClassSelection(1)).toBe(false);
    expect(requiresClassSelection(2)).toBe(true);
    expect(requiresClassSelection(7)).toBe(true);
  });
});

// ─── Payload tạo buổi live ──────────────────────────────────────────────────

describe("buildLivestreamCreatePayload — map sang CreateLivestreamDTO", () => {
  it("gửi đúng class_id giáo viên đã chọn, không lấy lớp đầu tiên", () => {
    const payload = buildLivestreamCreatePayload(
      { ...FORM, classId: "class-b", enableRecording: true },
      { ...CTX, classId: "class-b" }
    );
    expect(payload.class_id).toBe("class-b");
  });

  it("gửi đủ course_id / scheduled_at / is_recorded", () => {
    const payload = buildLivestreamCreatePayload(
      { ...FORM, classId: "class-a", enableRecording: false },
      { ...CTX, classId: "class-a" }
    );

    expect(payload).toEqual({
      title: "Q&A tuần 3",
      description: "Hỏi đáp",
      class_id: "class-a",
      course_id: "course-1",
      lesson_content_id: undefined,
      scheduled_at: new Date("2026-10-01T20:00:00").toISOString(),
      is_recorded: false,
    });
  });

  it("KHÔNG gửi host_id — backend lấy host từ access token (M-5)", () => {
    const payload = buildLivestreamCreatePayload(
      { ...FORM, classId: "class-a", enableRecording: true },
      { ...CTX, classId: "class-a" }
    );
    expect(payload).not.toHaveProperty("host_id");
    expect(Object.keys(payload)).not.toContain("host_id");
  });

  it("gắn lesson_content_id khi buổi live được tạo từ trong một bài học (M-1)", () => {
    const payload = buildLivestreamCreatePayload(
      { ...FORM, classId: "class-a", enableRecording: true },
      { ...CTX, classId: "class-a", lessonContentId: "content-1" }
    );
    // Là id **lesson_content**, không phải id lesson — xem submitLivestreamContent.
    expect(payload.lesson_content_id).toBe("content-1");
  });

  it("KHÔNG gửi các field backend không nhận (duration / platform / customLink / enableReminder)", () => {
    const payload = buildLivestreamCreatePayload(
      { ...FORM, classId: "class-a", enableRecording: true },
      { ...CTX, classId: "class-a" }
    );
    expect(Object.keys(payload).sort()).toEqual([
      "class_id",
      "course_id",
      "description",
      "is_recorded",
      "lesson_content_id",
      "scheduled_at",
      "title",
    ]);
  });

  it("mô tả rỗng → bỏ hẳn field thay vì gửi chuỗi rỗng", () => {
    const payload = buildLivestreamCreatePayload(
      { ...FORM, description: "", classId: "class-a", enableRecording: true },
      { ...CTX, classId: "class-a" }
    );
    expect(payload.description).toBeUndefined();
  });

  it("thiếu ngày hoặc giờ → scheduled_at undefined (backend tự xử lý, không gửi rác)", () => {
    const missingDate = buildLivestreamCreatePayload(
      { ...FORM, date: "", classId: "class-a" },
      { ...CTX, classId: "class-a" }
    );
    const missingTime = buildLivestreamCreatePayload(
      { ...FORM, startTime: "", classId: "class-a" },
      { ...CTX, classId: "class-a" }
    );
    expect(missingDate.scheduled_at).toBeUndefined();
    expect(missingTime.scheduled_at).toBeUndefined();
  });

  it("is_recorded mặc định false khi không truyền", () => {
    const payload = buildLivestreamCreatePayload(
      { ...FORM, classId: "class-a" },
      { ...CTX, classId: "class-a" }
    );
    expect(payload.is_recorded).toBe(false);
  });
});

// ─── Ghép ngày giờ ──────────────────────────────────────────────────────────

describe("buildScheduledAt", () => {
  it("ghép date + time thành ISO", () => {
    expect(buildScheduledAt("2026-10-01", "20:00")).toBe(
      new Date("2026-10-01T20:00:00").toISOString()
    );
  });

  it("trả undefined khi thiếu dữ liệu hoặc ngày không hợp lệ", () => {
    expect(buildScheduledAt(undefined, "20:00")).toBeUndefined();
    expect(buildScheduledAt("2026-10-01", undefined)).toBeUndefined();
    expect(buildScheduledAt("", "")).toBeUndefined();
    expect(buildScheduledAt("khong-phai-ngay", "20:00")).toBeUndefined();
  });
});

// ─── submitLivestreamContent: thứ tự gọi API (M-1) ──────────────────────────

describe("submitLivestreamContent — buổi live phải vào đúng bài học", () => {
  const INPUT = { ...FORM, classId: "class-a", enableRecording: true };
  const LESSON_CTX = { courseId: "course-1", classId: "class-a", lessonId: "lesson-1" };

  function makeDeps(overrides: Partial<LivestreamSubmitDeps> = {}): LivestreamSubmitDeps & {
    createLessonContent: ReturnType<typeof vi.fn>;
    createSession: ReturnType<typeof vi.fn>;
    deleteLessonContent: ReturnType<typeof vi.fn>;
  } {
    return {
      createLessonContent: vi.fn().mockResolvedValue({ id: "content-1" }),
      createSession: vi.fn().mockResolvedValue({ id: "session-1" }),
      deleteLessonContent: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    } as LivestreamSubmitDeps & {
      createLessonContent: ReturnType<typeof vi.fn>;
      createSession: ReturnType<typeof vi.fn>;
      deleteLessonContent: ReturnType<typeof vi.fn>;
    };
  }

  it("tạo lesson_content TRƯỚC, rồi gửi id vừa tạo vào lesson_content_id", async () => {
    const deps = makeDeps();
    const result = await submitLivestreamContent(INPUT, LESSON_CTX, deps);

    expect(deps.createLessonContent).toHaveBeenCalledWith({
      type: "livestream",
      title: "Q&A tuần 3",
    });
    expect(deps.createSession).toHaveBeenCalledTimes(1);
    const [dto] = deps.createSession.mock.calls[0] as [{ lesson_content_id?: string }];
    expect(dto.lesson_content_id).toBe("content-1");
    // Không bao giờ gửi id LESSON vào khoá ngoại lesson_content.
    expect(dto.lesson_content_id).not.toBe("lesson-1");
    expect(result).toEqual({ created: true, lessonContentId: "content-1" });
    expect(deps.deleteLessonContent).not.toHaveBeenCalled();
  });

  it("thứ tự: lesson_content xong mới tới POST /livestream", async () => {
    const order: string[] = [];
    const deps = makeDeps({
      createLessonContent: vi.fn(async () => {
        order.push("content");
        return { id: "content-1" };
      }),
      createSession: vi.fn(async () => {
        order.push("session");
        return {};
      }),
    });

    await submitLivestreamContent(INPUT, LESSON_CTX, deps);
    expect(order).toEqual(["content", "session"]);
  });

  it("không có lesson → phiên rời, bỏ trống lesson_content_id, không tạo lesson_content", async () => {
    const deps = makeDeps();
    const result = await submitLivestreamContent(
      INPUT,
      { courseId: "course-1", classId: "class-a", lessonId: null },
      deps
    );

    expect(deps.createLessonContent).not.toHaveBeenCalled();
    const [dto] = deps.createSession.mock.calls[0] as [{ lesson_content_id?: string }];
    expect(dto.lesson_content_id).toBeUndefined();
    expect(result).toEqual({ created: true, lessonContentId: undefined });
  });

  it("POST /livestream lỗi → KHÔNG ném (tránh toast thứ hai, M-4) và gỡ mục mồ côi", async () => {
    const deps = makeDeps({
      createSession: vi.fn().mockRejectedValue(new Error("boom")),
    });

    await expect(submitLivestreamContent(INPUT, LESSON_CTX, deps)).resolves.toEqual({
      created: false,
      lessonContentId: "content-1",
    });
    expect(deps.deleteLessonContent).toHaveBeenCalledWith("content-1");
  });

  it("tạo lesson_content lỗi → NÉM ra ngoài (chưa có gì để dọn)", async () => {
    const deps = makeDeps({
      createLessonContent: vi.fn().mockRejectedValue(new Error("tạo nội dung hỏng")),
    });

    await expect(submitLivestreamContent(INPUT, LESSON_CTX, deps)).rejects.toThrow(
      "tạo nội dung hỏng"
    );
    expect(deps.createSession).not.toHaveBeenCalled();
  });

  it("dọn mục mồ côi lỗi cũng không ném tiếp (không dội toast thứ ba)", async () => {
    const deps = makeDeps({
      createSession: vi.fn().mockRejectedValue(new Error("boom")),
      deleteLessonContent: vi.fn().mockRejectedValue(new Error("dọn hỏng")),
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(submitLivestreamContent(INPUT, LESSON_CTX, deps)).resolves.toEqual({
      created: false,
      lessonContentId: "content-1",
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
