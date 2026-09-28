import { describe, expect, it } from "vitest";
import type { ContestAttemptQuestion } from "@/types/contest";
import { buildSubmitAnswers, loadAnswerDraft, saveAnswerDraft, toggleAnswer } from "./contest-answers";

function q(id: string, type: ContestAttemptQuestion["question_type"]): ContestAttemptQuestion {
  return { id, question_text: id, question_type: type, points: 1, display_order: 0, answers: [] };
}

describe("buildSubmitAnswers", () => {
  const questions = [q("q1", "single_choice"), q("q2", "multiple_choice"), q("q3", "fill_blank"), q("q4", "true_false")];

  it("choice -> selected_answer_ids, fill_blank -> text_answer (đã trim), bỏ câu chưa trả lời", () => {
    const body = buildSubmitAnswers(questions, {
      q1: { selected: ["a1"], text: "" },
      q2: { selected: ["b1", "b2"], text: "" },
      q3: { selected: [], text: "  git commit  " },
      q4: { selected: [], text: "" },
    });
    expect(body).toEqual([
      { question_id: "q1", selected_answer_ids: ["a1"] },
      { question_id: "q2", selected_answer_ids: ["b1", "b2"] },
      { question_id: "q3", text_answer: "git commit" },
    ]);
  });

  it("fill_blank chỉ toàn khoảng trắng -> coi như bỏ trống", () => {
    expect(buildSubmitAnswers([q("q3", "fill_blank")], { q3: { selected: [], text: "   " } })).toEqual([]);
  });
});

describe("toggleAnswer", () => {
  it("một lựa chọn: chọn đáp án khác thì thay thế", () => {
    expect(toggleAnswer(q("q1", "single_choice"), { selected: ["a1"], text: "" }, "a2").selected).toEqual(["a2"]);
  });

  it("nhiều lựa chọn: bật/tắt từng đáp án", () => {
    const question = q("q2", "multiple_choice");
    const on = toggleAnswer(question, { selected: ["b1"], text: "" }, "b2");
    expect(on.selected).toEqual(["b1", "b2"]);
    expect(toggleAnswer(question, on, "b1").selected).toEqual(["b2"]);
  });
});

describe("nháp bài làm theo attempt_id", () => {
  it("lưu rồi đọc lại đúng attempt, attempt khác không thấy", () => {
    saveAnswerDraft("att-1", { q1: { selected: ["a1"], text: "" } });
    expect(loadAnswerDraft("att-1")).toEqual({ q1: { selected: ["a1"], text: "" } });
    expect(loadAnswerDraft("att-2")).toEqual({});
  });

  it("dữ liệu hỏng -> nháp rỗng, không ném lỗi", () => {
    window.localStorage.setItem("contest-draft:att-bad", "{not json");
    expect(loadAnswerDraft("att-bad")).toEqual({});
  });
});
