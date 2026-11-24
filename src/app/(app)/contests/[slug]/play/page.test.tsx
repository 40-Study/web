/**
 * QA4 S11: vào /contests/:slug/play là gọi POST /start ngay, đồng hồ 30 phút chạy luôn. Lượt CHƯA bắt đầu
 * phải qua bước "Sẵn sàng làm bài?"; lượt đang làm dở (tải lại trang) thì vào thẳng.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();
let attemptStatus = "NOT_STARTED";
const detail = () => ({
  id: "c1",
  slug: "demo-thi-git",
  title: "Thi Git cơ bản",
  type: "QUIZ",
  phase: "ACTIVE",
  duration_minutes: 30,
  question_count: 3,
  viewer: { my_participation: { attempt_status: attemptStatus } },
});
vi.mock("@/hooks/queries/use-contests", () => ({
  useContestDetail: () => ({ isLoading: false, error: null, data: detail() }),
  useStartContest: () => ({ mutate, data: undefined, error: null }),
}));
vi.mock("../../_components/contest-player", () => ({ ContestPlayer: () => <div>player</div> }));
vi.mock("../../_components/contest-code-player", () => ({ ContestCodePlayer: () => null }));

import ContestPlayPage from "./page";

beforeEach(() => {
  mutate.mockReset();
});

describe("ContestPlayPage — bước sẵn sàng (S11)", () => {
  it("chưa bắt đầu: hiện 'Sẵn sàng làm bài?', chưa gọi start cho tới khi bấm", () => {
    attemptStatus = "NOT_STARTED";
    render(<ContestPlayPage />);
    expect(screen.getByText("Sẵn sàng làm bài?")).toBeTruthy();
    expect(mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu làm bài" }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith("c1");
  });

  it("đang làm dở: vào thẳng, gọi start (idempotent) để lấy lại lượt", () => {
    attemptStatus = "IN_PROGRESS";
    render(<ContestPlayPage />);
    expect(screen.queryByText("Sẵn sàng làm bài?")).toBeNull();
    expect(mutate).toHaveBeenCalledTimes(1);
  });
});
