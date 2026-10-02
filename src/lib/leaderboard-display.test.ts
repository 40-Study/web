import { describe, expect, it } from "vitest";
import { ANONYMOUS_LEARNER_LABEL, leaderboardEntryKey, leaderboardEntryName } from "./leaderboard-display";

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