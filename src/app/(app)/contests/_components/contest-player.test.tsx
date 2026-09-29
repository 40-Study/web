/**
 * Review m3: nộp bài THÀNH CÔNG thì xoá nháp khỏi localStorage (máy dùng chung); nộp lỗi thì giữ
 * nháp để nộp lại.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContestDetail, ContestStartResult } from "@/types/contest";

type MutateOptions = { onSuccess?: () => void; onError?: (e: unknown) => void };
const mutateMock = vi.fn();
vi.mock("@/hooks/queries/use-contests", () => ({
  useSubmitContest: () => ({ mutate: mutateMock, isPending: false, isSuccess: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ContestPlayer } from "./contest-player";

const session: ContestStartResult = {
  attempt_id: "att-1",
  deadline_at: "2099-01-01T00:00:00Z",
  server_time: new Date().toISOString(),
  duration_minutes: 15,
  questions: [
    { id: "q1", question_text: "Câu một", question_type: "single_choice", points: 1, display_order: 1, answers: [{ id: "a1", answer_text: "A", display_order: 1 }] },
  ],
};
const detail = { id: "c1", slug: "thi-git", title: "Thi Git" } as ContestDetail;
const DRAFT_KEY = "contest-draft:att-1";

function submitVia(outcome: (opts: MutateOptions) => void) {
  mutateMock.mockImplementation((_vars: unknown, opts: MutateOptions) => outcome(opts));
  render(<ContestPlayer detail={detail} session={session} />);
  fireEvent.click(screen.getByRole("button", { name: /Nộp bài/ }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Nộp bài" }));
}

beforeEach(() => {
  mutateMock.mockReset();
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ q1: { selected: ["a1"], text: "" } }));
});

describe("ContestPlayer — nháp sau khi nộp", () => {
  it("nộp thành công -> nháp bị xoá", () => {
    submitVia((opts) => opts.onSuccess?.());
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("nộp lỗi mạng -> nháp còn nguyên", () => {
    submitVia((opts) => opts.onError?.(new Error("network")));
    expect(window.localStorage.getItem(DRAFT_KEY)).not.toBeNull();
  });
});
