/**
 * Phase 0 review — finding #1 (không tự lấy lớp đầu tiên) và #2 (không mất
 * field im lặng).
 *
 * Test thuần logic, không render: nguồn sự thật cho luật chọn lớp và cho
 * payload gửi lên `POST /livestream` (`dto.CreateLivestreamDTO`).
 */

import { describe, expect, it } from "vitest";
import {
  buildLivestreamCreatePayload,
  buildScheduledAt,
  requiresClassSelection,
  resolveLivestreamClassId,
} from "./livestream";

const CLASSES = [
  { id: "class-a", name: "Lớp A" },
  { id: "class-b", name: "Lớp B" },
];

const CTX = { hostId: "host-1", courseId: "course-1" };
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

  it("gửi đủ host_id / course_id / scheduled_at / is_recorded", () => {
    const payload = buildLivestreamCreatePayload(
      { ...FORM, classId: "class-a", enableRecording: false },
      { ...CTX, classId: "class-a" }
    );

    expect(payload).toEqual({
      title: "Q&A tuần 3",
      description: "Hỏi đáp",
      host_id: "host-1",
      class_id: "class-a",
      course_id: "course-1",
      scheduled_at: new Date("2026-10-01T20:00:00").toISOString(),
      is_recorded: false,
    });
  });

  it("KHÔNG gửi lesson_content_id (currentLessonId là lesson, không phải lesson_content)", () => {
    const payload = buildLivestreamCreatePayload(
      { ...FORM, classId: "class-a", enableRecording: true },
      { ...CTX, classId: "class-a" }
    );
    expect(payload).not.toHaveProperty("lesson_content_id");
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
      "host_id",
      "is_recorded",
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
