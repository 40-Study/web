/**
 * QA4 S4: ô từng ghi "Hôm nay" nhưng số là tổng thời gian xem của mọi khoá
 * (my-courses cộng mọi watchedSeconds) — nhãn phải nói đúng là tổng.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatsWidgets } from "./stats-widgets";

describe("StatsWidgets", () => {
  it("gọi ô thời gian là tổng thời gian học, không phải hôm nay", () => {
    render(<StatsWidgets stats={{ timeSpent: "2h 50m", progress: 40 }} />);
    expect(screen.getByText("Tổng thời gian học")).toBeTruthy();
    expect(screen.queryByText("Hôm nay")).toBeNull();
  });
});
