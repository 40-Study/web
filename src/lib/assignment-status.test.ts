import { describe, expect, it } from "vitest";
import { classifyAssignment, isPastDue, type AssignmentStatus } from "@/lib/assignment-status";
import type { AssignmentResponseDTO } from "@/services/assignment.service";

// Đúng shape GET /assignments?session_id= (student1, seed demo, đọc 2026-10-01 08:38 +07:00):
// có `end_time`, KHÔNG có `start_time`; mọi bài grace 15 phút, max_late_days 3.
function seed(title: string, endTime: string, allowLate = true): AssignmentResponseDTO {
  return {
    id: title,
    session_id: "s",
    type: "coding",
    title,
    description: "",
    difficulty: "easy",
    language: ["javascript"],
    starter_code: "",
    time_limit: 2,
    memory_limit: 256,
    duration_minutes: 15,
    is_published: true,
    published_at: "2026-09-22T10:00:00+07:00",
    end_time: endTime,
    show_in_recap: true,
    allow_late_submission: allowLate,
    late_penalty_percent: 10,
    max_late_days: 3,
    grace_period_minutes: 15,
    created_at: "2026-09-20T10:00:00+07:00",
  } as unknown as AssignmentResponseDTO;
}

const NOW = new Date("2026-10-01T08:38:00+07:00");

const SEED = [
  seed("Top 5 sản phẩm bán chạy", "2026-10-04T23:59:00+07:00"),
  seed("Điểm trung bình theo lớp", "2026-09-27T23:59:00+07:00"),
  seed("Màn hình danh sách khoá học", "2026-10-02T23:59:00+07:00"),
  seed("Định dạng giá tiền VNĐ", "2026-09-25T23:59:00+07:00"),
  seed("Mini project: Trang danh sách khoá học", "2026-10-06T23:59:00+07:00", false),
  seed("Custom hook useDebounce", "2026-09-29T23:59:00+07:00"),
  seed("Tính tổng giỏ hàng", "2026-09-21T23:59:00+07:00"),
];

describe("classifyAssignment", () => {
  it("dữ liệu seed thật: tab Đã đóng KHÔNG rỗng, đúng các bài hết cả hạn nộp muộn", () => {
    const ended = SEED.filter((a) => classifyAssignment(a, NOW) === "ended").map((a) => a.title);
    expect(ended).toEqual([
      "Điểm trung bình theo lớp",
      "Định dạng giá tiền VNĐ",
      "Tính tổng giỏ hàng",
    ]);
  });

  it("mỗi bài thuộc đúng một tab", () => {
    const tabs: AssignmentStatus[] = ["upcoming", "active", "ended"];
    for (const a of [...SEED, { ...SEED[0], is_published: false }]) {
      const hits = tabs.filter((t) => classifyAssignment(a, NOW) === t);
      expect(hits).toHaveLength(1);
    }
  });

  it("đang trong khoảng nộp muộn vẫn là Đang mở, nhưng đánh dấu quá hạn", () => {
    const debounce = SEED[5];
    expect(classifyAssignment(debounce, NOW)).toBe("active");
    expect(isPastDue(debounce, NOW)).toBe(true);
    expect(isPastDue(SEED[0], NOW)).toBe(false);
  });

  it("không cho nộp muộn: đóng ngay sau end_time + thời gian ân hạn", () => {
    const strict = seed("x", "2026-10-01T08:00:00+07:00", false);
    expect(classifyAssignment(strict, new Date("2026-10-01T08:14:00+07:00"))).toBe("active");
    expect(classifyAssignment(strict, new Date("2026-10-01T08:16:00+07:00"))).toBe("ended");
  });

  it("chưa công bố hoặc start_time tương lai là Sắp tới; không có end_time thì luôn mở", () => {
    expect(classifyAssignment({ ...SEED[0], is_published: false }, NOW)).toBe("upcoming");
    expect(classifyAssignment({ ...SEED[0], start_time: "2026-10-03T08:00:00+07:00" }, NOW)).toBe("upcoming");
    expect(classifyAssignment({ ...SEED[3], end_time: undefined }, NOW)).toBe("active");
  });
});
