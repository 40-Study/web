/** Q6-PG-10: thẻ cuộc thi ghi "15840 phút làm bài" đọc như lỗi dữ liệu; từ 1 ngày trở lên phải ghi bằng ngày. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContestCard } from "./contest-card";
import type { ContestSummary } from "@/types/contest";

const contest = (duration_minutes: number) =>
  ({
    id: "c1", slug: "thi-thu", title: "Thi thử", description: "", type: "QUIZ", phase: "UPCOMING",
    start_time: "2026-11-30T01:00:00Z", end_time: "2026-12-10T01:00:00Z", duration_minutes,
    question_count: 5, total_points: 10, participant_count: 0, max_participants: 0,
    prizes: [], has_voucher_prize: false, course: null,
  }) as unknown as ContestSummary;

describe("ContestCard — thời lượng", () => {
  it.each([
    [45, "45 phút làm bài"],
    [90, "1 giờ 30 phút làm bài"],
    [15840, "11 ngày làm bài"],
  ])("%i phút -> %s", (minutes, text) => {
    render(<ContestCard contest={contest(minutes)} />);
    expect(screen.getByText(text)).toBeTruthy();
  });
});
