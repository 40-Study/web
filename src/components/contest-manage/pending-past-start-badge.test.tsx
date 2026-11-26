/**
 * Q7: cuộc thi còn "Chờ duyệt" sau giờ bắt đầu -> huy hiệu "Đã quá giờ bắt đầu, chờ duyệt" cho giảng viên.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { isPendingPastStart } from "@/lib/contest-manage/actions";
import { PendingPastStartBadge } from "./pending-past-start-badge";

const NOW = new Date("2026-11-25T03:00:00Z");
const past = "2026-11-24T06:08:00Z";
const future = "2026-12-01T06:08:00Z";

describe("isPendingPastStart", () => {
  it("chờ duyệt + đã qua giờ bắt đầu -> true; đúng giờ bắt đầu cũng true (backend: !start.After(now))", () => {
    expect(isPendingPastStart({ status: "PENDING_REVIEW", start_time: past }, NOW)).toBe(true);
    expect(isPendingPastStart({ status: "PENDING_REVIEW", start_time: NOW.toISOString() }, NOW)).toBe(true);
  });
  it("còn ở tương lai, hoặc trạng thái khác chờ duyệt -> false", () => {
    expect(isPendingPastStart({ status: "PENDING_REVIEW", start_time: future }, NOW)).toBe(false);
    for (const status of ["DRAFT", "PUBLISHED", "REJECTED", "CANCELLED"] as const) {
      expect(isPendingPastStart({ status, start_time: past }, NOW)).toBe(false);
    }
  });
  it("start_time hỏng -> false", () => {
    expect(isPendingPastStart({ status: "PENDING_REVIEW", start_time: "khong-phai-ngay" }, NOW)).toBe(false);
  });
});

describe("PendingPastStartBadge", () => {
  it("hiện huy hiệu khi quá giờ", () => {
    render(<PendingPastStartBadge contest={{ status: "PENDING_REVIEW", start_time: past }} now={NOW} />);
    expect(screen.getByTestId("pending-past-start").textContent).toBe("Đã quá giờ bắt đầu, chờ duyệt");
  });
  it("không hiện khi chưa tới giờ", () => {
    render(<PendingPastStartBadge contest={{ status: "PENDING_REVIEW", start_time: future }} now={NOW} />);
    expect(screen.queryByTestId("pending-past-start")).toBeNull();
  });
});
