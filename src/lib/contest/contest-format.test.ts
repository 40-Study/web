import { describe, expect, it } from "vitest";
import { CONTEST_PHASES } from "@/types/contest";
import {
  CONTEST_PHASE_LABELS,
  contestRevealAt,
  resolveLeaderboardVisibility,
  formatContestPercent,
  formatContestPrize,
  formatContestScore,
  formatCountdown,
  msUntil,
  serverClockOffset,
} from "./contest-format";

describe("hiển thị theo phase", () => {
  it("mọi phase trong enum đều có nhãn tiếng Việt", () => {
    for (const phase of CONTEST_PHASES) expect(CONTEST_PHASE_LABELS[phase]).toMatch(/[à-ỹÀ-Ỹđ]/);
  });

  it("nhãn cụ thể", () => {
    expect(CONTEST_PHASE_LABELS.UPCOMING).toBe("Sắp diễn ra");
    expect(CONTEST_PHASE_LABELS.ACTIVE).toBe("Đang diễn ra");
    expect(CONTEST_PHASE_LABELS.ENDED).toBe("Đã kết thúc");
    expect(CONTEST_PHASE_LABELS.FINALIZED).toBe("Đã có kết quả");
  });
});

describe("decimal backend (number, hoặc string ở bản build khác)", () => {
  it("nhận cả number lẫn string, null -> gạch ngang", () => {
    expect(formatContestScore(7.5)).toBe("7,5");
    expect(formatContestScore("7.50")).toBe("7,5");
    expect(formatContestScore(null)).toBe("—");
    expect(formatContestPercent(66.666)).toBe("66,7%");
  });
});

describe("đồng hồ theo giờ server", () => {
  it("máy chạy chậm 2 phút so với server vẫn đếm đúng theo server", () => {
    const clientNow = Date.parse("2026-09-28T10:00:00Z");
    const offset = serverClockOffset("2026-09-28T10:02:00Z", clientNow);
    expect(offset).toBe(120_000);
    expect(msUntil("2026-09-28T10:05:00Z", offset, clientNow)).toBe(180_000);
  });

  it("đã qua mốc -> 0, không âm", () => {
    expect(msUntil("2026-09-28T09:00:00Z", 0, Date.parse("2026-09-28T10:00:00Z"))).toBe(0);
  });

  it("formatCountdown", () => {
    expect(formatCountdown(65_000)).toBe("00:01:05");
    expect(formatCountdown(93_784_000)).toBe("1 ngày 02:03:04");
  });
});

describe("mốc công bố BXH/đáp án = end_time + 30s (ĐÍNH CHÍNH 2)", () => {
  const END = "2026-09-29T10:00:00Z";
  const REVEAL = contestRevealAt(END);

  it("contestRevealAt cộng đúng ân hạn", () => {
    expect(REVEAL).toBe("2026-09-29T10:00:30.000Z");
  });

  it("ENDED trong ân hạn -> ẩn, câu không nói 'sau khi cuộc thi kết thúc'", () => {
    const v = resolveLeaderboardVisibility("ENDED", REVEAL, 12_000);
    expect(v.visible).toBe(false);
    if (!v.visible) {
      expect(v.message).toContain("đã kết thúc");
      expect(v.message).toContain("00:00:12");
      expect(v.message).not.toContain("sau khi cuộc thi kết thúc");
    }
  });

  it("ENDED qua mốc -> hiện; FINALIZED -> hiện; UPCOMING/ACTIVE -> ẩn", () => {
    expect(resolveLeaderboardVisibility("ENDED", REVEAL, 0).visible).toBe(true);
    expect(resolveLeaderboardVisibility("FINALIZED", REVEAL, null).visible).toBe(true);
    expect(resolveLeaderboardVisibility("ACTIVE", REVEAL, null).visible).toBe(false);
    expect(resolveLeaderboardVisibility("UPCOMING", REVEAL, null).visible).toBe(false);
  });
});

describe("formatContestPrize", () => {
  it("khoảng hạng + phần thưởng", () => {
    expect(formatContestPrize({ id: "p", rank_from: 1, rank_to: 3, grant_certificate: true, voucher: { id: "v", name: "Giảm 50k" } })).toBe(
      "Hạng 1–3: Chứng nhận + Voucher Giảm 50k"
    );
    expect(formatContestPrize({ id: "p", rank_from: 1, rank_to: 1, grant_certificate: true, voucher: null })).toBe("Hạng 1: Chứng nhận");
  });
});
