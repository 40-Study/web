import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContestAnswersPending, ContestAwardPanel } from "./contest-result-parts";

afterEach(() => vi.useRealTimers());

describe("ContestAwardPanel — review m2 (nút tràn ở 390px)", () => {
  it("số chứng nhận nằm NGOÀI nút (nút nowrap), nhãn nút ngắn", () => {
    render(<ContestAwardPanel slug="thi-git" award={{ certificate_number: "CONTEST-20260929-0891ece8", voucher: null }} />);
    const link = screen.getByRole("link", { name: "Xem chứng nhận" });
    expect(link.getAttribute("href")).toBe("/contests/thi-git/certificate");
    expect(link.textContent).not.toContain("CONTEST-");
    const number = screen.getByTestId("certificate-number");
    expect(number.textContent).toContain("CONTEST-20260929-0891ece8");
    expect(number.className).toContain("break-all");
  });
});

describe("ContestAnswersPending — review m1 (đếm tới answers_available_at, tự tải lại)", () => {
  const AVAILABLE = "2026-09-29T10:00:30Z";

  it("hiện giờ công bố có giây và đồng hồ đếm ngược theo giờ server", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-29T10:00:05Z"));
    render(<ContestAnswersPending answersAvailableAt={AVAILABLE} serverTime="2026-09-29T10:00:05Z" receivedAt={Date.now()} onAvailable={() => {}} />);
    expect(screen.getByText(/17:00:30 29\/09\/2026/)).toBeTruthy();
    expect(screen.getByRole("timer").textContent).toContain("00:00:25");
  });

  it("qua mốc -> gọi onAvailable đúng một lần", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-29T10:00:28Z"));
    const onAvailable = vi.fn();
    render(<ContestAnswersPending answersAvailableAt={AVAILABLE} serverTime="2026-09-29T10:00:28Z" receivedAt={Date.now()} onAvailable={onAvailable} />);
    expect(onAvailable).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(onAvailable).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toContain("đang tải đáp án");
  });

  it("server_time lấy từ cache 20 giây trước -> đồng hồ vẫn đúng nhờ receivedAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-29T10:00:25Z"));
    // Dữ liệu nhận lúc 10:00:05 (server cũng 10:00:05); giờ là 10:00:25 -> còn 5 giây, không phải 25.
    render(
      <ContestAnswersPending
        answersAvailableAt={AVAILABLE}
        serverTime="2026-09-29T10:00:05Z"
        receivedAt={Date.parse("2026-09-29T10:00:05Z")}
        onAvailable={() => {}}
      />
    );
    expect(screen.getByRole("timer").textContent).toContain("00:00:05");
  });
});
