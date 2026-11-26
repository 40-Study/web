/**
 * L1 (QA7 S7-07): "NỘP LÚC" từ "dd/MM HH:mm" thành "dd/MM/yyyy HH:mm" (dài hơn) nhưng ô không có
 * whitespace-nowrap nên xuống dòng giữa ngày và giờ ở bề ngang hẹp (390px).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonCodeHistory } from "./lesson-code-history";

describe("LessonCodeHistory — ô thời gian nộp", () => {
  it("ngày giờ nằm trong ô không được ngắt dòng", () => {
    render(
      <LessonCodeHistory
        items={[{ id: "s1", language: "python", code: "x", status: "ACCEPTED", passed: 1, total: 1, score: 100, created_at: "2026-11-25T20:30:00Z" }]}
        total={1}
        loading={false}
        failed={false}
        disabled={false}
        onOpen={() => {}}
      />
    );
    const time = screen.getByText("26/11/2026 03:30");
    expect(time.closest("td")?.className).toContain("whitespace-nowrap");
  });
});
