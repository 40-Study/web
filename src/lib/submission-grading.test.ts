import { describe, expect, it } from "vitest";
import type { Grade } from "@/services/grade.service";
import type { SubmissionResponseDTO } from "@/services/submission.service";
import {
  buildGradingRows,
  gradeTitleFor,
  isLateSubmission,
  parseScoreInput,
  submissionText,
} from "./submission-grading";

function sub(over: Partial<SubmissionResponseDTO>): SubmissionResponseDTO {
  return {
    id: "s1",
    assignment_id: "a1",
    user_id: "u1",
    user: { id: "u1", username: "student1" },
    language: "javascript",
    code: "x",
    verdict: "accepted",
    score: 100,
    execution_time: 1,
    memory_used: 1,
    test_cases_passed: 3,
    total_test_cases: 3,
    created_at: "2026-10-01T10:00:00+07:00",
    ...over,
  };
}

function grade(over: Partial<Grade>): Grade {
  return {
    id: "g1",
    class_id: "c1",
    student_id: "u1",
    assignment_id: "a1",
    grade_type: "assignment",
    title: "Bài tập: A",
    score: 9,
    max_score: 10,
    graded_by: "t1",
    graded_by_name: "Nguyễn Văn A",
    ...over,
  };
}

describe("buildGradingRows", () => {
  it("bài nộp 'accepted' nhưng chưa có điểm vẫn là CHƯA CHẤM (không suy từ verdict)", () => {
    const rows = buildGradingRows({
      submissions: [sub({ verdict: "accepted" })],
      grades: [],
      assignmentId: "a1",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("ungraded");
    expect(rows[0].grade).toBeUndefined();
  });

  it("bài nộp sai (wrong_answer) có bản ghi điểm là ĐÃ CHẤM và mang theo người chấm", () => {
    const rows = buildGradingRows({
      submissions: [sub({ verdict: "wrong_answer", score: 33 })],
      grades: [grade({})],
      assignmentId: "a1",
    });
    expect(rows[0].status).toBe("graded");
    expect(rows[0].grade?.graded_by_name).toBe("Nguyễn Văn A");
  });

  it("điểm của bài tập KHÁC hoặc của học viên khác không làm bài này thành đã chấm", () => {
    const rows = buildGradingRows({
      submissions: [sub({})],
      grades: [grade({ assignment_id: "a2" }), grade({ id: "g2", student_id: "u2" })],
      assignmentId: "a1",
    });
    expect(rows[0].status).toBe("ungraded");
  });

  it("nhiều lần nộp: lấy bài mới nhất và đếm số lần", () => {
    const rows = buildGradingRows({
      submissions: [
        sub({ id: "old", created_at: "2026-10-01T08:00:00+07:00", code: "cũ" }),
        sub({ id: "new", created_at: "2026-10-02T08:00:00+07:00", code: "mới" }),
      ],
      grades: [],
      assignmentId: "a1",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].submission.id).toBe("new");
    expect(rows[0].attempts).toBe(2);
  });

  it("chưa chấm xếp trước đã chấm, cùng nhóm xếp theo tên", () => {
    const rows = buildGradingRows({
      submissions: [
        sub({ id: "1", user_id: "u1", user: { id: "u1", username: "An" } }),
        sub({ id: "2", user_id: "u2", user: { id: "u2", username: "Bình" } }),
        sub({ id: "3", user_id: "u3", user: { id: "u3", username: "Chi" } }),
      ],
      grades: [grade({ student_id: "u1", student_name: "An" })],
      assignmentId: "a1",
    });
    expect(rows.map((r) => r.studentName)).toEqual(["Bình", "Chi", "An"]);
  });

  it("tên học viên ưu tiên họ tên trong bản ghi điểm, rồi tới username", () => {
    const rows = buildGradingRows({
      submissions: [sub({})],
      grades: [grade({ student_name: "Lê Văn C" })],
      assignmentId: "a1",
    });
    expect(rows[0].studentName).toBe("Lê Văn C");
  });
});

describe("isLateSubmission", () => {
  it("so mốc thời gian chứ không so chuỗi: cùng thời điểm khác offset thì không muộn", () => {
    // 20:59+07:00 = 13:59Z; hạn 14:00Z. So chuỗi sẽ cho "2026-09-21T20:59" > "2026-09-21T14:00" = muộn (sai).
    expect(isLateSubmission("2026-09-21T20:59:00+07:00", "2026-09-21T14:00:00Z")).toBe(false);
  });

  it("nộp sau hạn là muộn, trong thời gian ân hạn thì không", () => {
    expect(isLateSubmission("2026-09-21T14:10:00Z", "2026-09-21T14:00:00Z")).toBe(true);
    expect(isLateSubmission("2026-09-21T14:10:00Z", "2026-09-21T14:00:00Z", 15)).toBe(false);
  });

  it("không có hạn hoặc thời gian hỏng thì không báo muộn", () => {
    expect(isLateSubmission("2026-09-21T14:10:00Z", undefined)).toBe(false);
    expect(isLateSubmission("không phải ngày", "2026-09-21T14:00:00Z")).toBe(false);
  });
});

describe("parseScoreInput", () => {
  it("nhận số, dấu phẩy thập phân và 0", () => {
    expect(parseScoreInput("8,5")).toEqual({ ok: true, value: 8.5 });
    expect(parseScoreInput("0")).toEqual({ ok: true, value: 0 });
    expect(parseScoreInput(" 10 ")).toEqual({ ok: true, value: 10 });
  });

  it("chặn rỗng, chữ, âm và vượt thang", () => {
    expect(parseScoreInput("").ok).toBe(false);
    expect(parseScoreInput("abc").ok).toBe(false);
    expect(parseScoreInput("-1").ok).toBe(false);
    const over = parseScoreInput("10.5");
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.message).toContain("0 đến 10");
  });
});

describe("submissionText", () => {
  it("tự luận (HTML) hiện dạng văn bản thuần, không giữ thẻ do học viên gửi", () => {
    const text = submissionText({ language: "text", code: "<p>Xin chào</p><script>alert(1)</script><p>Dòng 2&nbsp;ok</p>" });
    expect(text).not.toContain("<");
    expect(text).toContain("Xin chào");
    expect(text).toContain("Dòng 2 ok");
  });

  it("code và JSON giữ nguyên", () => {
    expect(submissionText({ language: "python", code: "print('<p>')" })).toBe("print('<p>')");
  });
});

describe("gradeTitleFor", () => {
  it("theo quy ước 'Bài tập: <tên>' của dữ liệu sổ điểm", () => {
    expect(gradeTitleFor("Tính tổng giỏ hàng")).toBe("Bài tập: Tính tổng giỏ hàng");
  });
});
