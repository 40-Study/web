import { describe, expect, it } from "vitest";
import { ANONYMOUS_LEARNER_LABEL, leaderboardEntryKey, leaderboardEntryName, secondsUntilWeeklyReset } from "./leaderboard-display";

describe("leaderboardEntryName", () => {
  it("ưu tiên display_name do backend áp cài đặt riêng tư", () => {
    expect(leaderboardEntryName({ display_name: "Học viên ẩn danh", full_name: "Tên thật", user_name: "ten_that" })).toBe("Học viên ẩn danh");
  });
  it("phản hồi cũ chưa có display_name thì lùi về full_name rồi user_name", () => {
    expect(leaderboardEntryName({ display_name: "", full_name: "An", user_name: "an99" })).toBe("An");
    expect(leaderboardEntryName({ display_name: "", user_name: "an99" })).toBe("an99");
  });
  it("không có trường tên nào thì dùng nhãn ẩn danh thay vì rỗng", () => {
    expect(leaderboardEntryName({ display_name: "" })).toBe(ANONYMOUS_LEARNER_LABEL);
  });
});

describe("leaderboardEntryKey", () => {
  it("dùng user_id khi có, và vị trí khi người ẩn danh không có id (không trùng nhau)", () => {
    expect(leaderboardEntryKey({ user_id: "u-1" }, 5)).toBe("u-1");
    expect(leaderboardEntryKey({}, 0)).not.toBe(leaderboardEntryKey({}, 1));
  });
});
// QA4 S9: kỳ tuần của backend là tuần ISO (bắt đầu thứ Hai, giờ UTC).
describe("secondsUntilWeeklyReset", () => {
  it("thứ Hai 15:00 UTC: còn 6 ngày 9 giờ tới thứ Hai sau", () => {
    expect(secondsUntilWeeklyReset(new Date("2026-11-23T15:00:00Z"))).toBe((6 * 24 + 9) * 3600);
  });
  it("Chủ nhật 23:00 UTC: còn 1 giờ (không phải 7 ngày)", () => {
    expect(secondsUntilWeeklyReset(new Date("2026-11-29T23:00:00Z"))).toBe(3600);
  });
  it("đúng 00:00 thứ Hai: kỳ mới vừa bắt đầu, còn trọn 7 ngày", () => {
    expect(secondsUntilWeeklyReset(new Date("2026-11-30T00:00:00Z"))).toBe(7 * 24 * 3600);
  });
});
