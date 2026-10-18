/**
 * C-004 regression — quiz-lesson-content.tsx hook correctness
 *
 * Proves: timeout and manual completion both submit the latest answers exactly
 * once, and the auto-submit effect does not fire a second time after isSubmitted
 * is true.
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuizLessonContent, type QuizData } from "./quiz-lesson-content";

// ─── Fixture ─────────────────────────────────────────────────────────────────

const QUIZ: QuizData = {
  id: "q1",
  title: "Test Quiz",
  timeLimitMinutes: 1, // 60 s
  questions: [
    {
      id: "qst-1",
      question: "What is 1+1?",
      options: [
        { key: "A", text: "1" },
        { key: "B", text: "2" },
        { key: "C", text: "3" },
        { key: "D", text: "4" },
      ],
    },
  ],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("QuizLessonContent — hook correctness (C-004)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("timeout auto-submit sends the latest answers exactly once", async () => {
    const onSubmit = vi.fn();

    render(<QuizLessonContent quiz={QUIZ} onSubmit={onSubmit} />);

    // Select option B before timer expires
    const optionB = screen.getByText("2");
    fireEvent.click(optionB);

    // Advance time to expiry (60 s = 60_000 ms)
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    // onSubmit should be called exactly once
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // The submitted answers must include the B selection for qst-1
    const [submittedAnswers] = onSubmit.mock.calls[0] as [Record<string, string>, number];
    expect((submittedAnswers as Record<string, string>)["qst-1"]).toBe("B");

    // Advance further — should NOT trigger a second submit
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("manual submit sends the latest answers exactly once and blocks duplicates", async () => {
    const onSubmit = vi.fn();

    render(<QuizLessonContent quiz={QUIZ} onSubmit={onSubmit} />);

    // Select option C
    const optionC = screen.getByText("3");
    fireEvent.click(optionC);

    // Click Submit button
    const submitBtn = screen.getByRole("button", { name: /nộp bài/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [submittedAnswers] = onSubmit.mock.calls[0] as [Record<string, string>, number];
    expect((submittedAnswers as Record<string, string>)["qst-1"]).toBe("C");

    // Second click should be a no-op (isSubmitted guard)
    await act(async () => {
      fireEvent.click(submitBtn);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});


describe("QuizLessonContent — retry after failure",()=>{
 it("failed timeout submits once and allows explicit retry with the retained answers",async()=>{
  vi.useFakeTimers();
  try {
   const submit=vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValue(undefined);
   render(<QuizLessonContent quiz={{...QUIZ,timeLimitMinutes:0.01}} onSubmit={submit} />);
   fireEvent.click(screen.getByRole("button",{name:/B\s*2/}));
   await act(async()=>{vi.advanceTimersByTime(1000)});
   expect(submit).toHaveBeenCalledTimes(1);expect(screen.getByRole("alert").textContent).toContain("Câu trả lời vẫn được giữ");
   await act(async()=>{vi.advanceTimersByTime(5000)});expect(submit).toHaveBeenCalledTimes(1);
   await act(async()=>{fireEvent.click(screen.getByRole("button",{name:"Nộp bài"}))});expect(submit).toHaveBeenCalledTimes(2);expect(submit.mock.calls[1][0]).toEqual({"qst-1":"B"});
  } finally {vi.useRealTimers()}
 });
 it("double selection of the same answer saves once",()=>{
  const save=vi.fn();render(<QuizLessonContent apiQuiz={{attempt_id:'att',quiz_id:'quiz',title:'Quiz',started_at:new Date().toISOString(),questions:[{id:'q',question_text:'1+1?',question_type:'single_choice',points:1,display_order:0,answers:[{id:'a',answer_text:'2',display_order:0}]}]}} onSubmit={vi.fn()} onSaveAnswer={save} />);
  const answer=screen.getByRole('button',{name:/A\s*2/});fireEvent.click(answer);fireEvent.click(answer);expect(save).toHaveBeenCalledTimes(1);
 });
});
