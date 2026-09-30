import { describe, expect, it } from "vitest";
import { FRIENDS_TABS, parseFriendsTab } from "./friends-tabs";

describe("parseFriendsTab (?tab= deep-link từ thông báo)", () => {
  it("giá trị hợp lệ giữ nguyên, gồm requests mà thông báo lời mời trỏ tới", () => {
    for (const tab of FRIENDS_TABS) expect(parseFriendsTab(tab)).toBe(tab);
    expect(parseFriendsTab("requests")).toBe("requests");
  });

  it("thiếu hoặc lạ thì về tab Bạn bè, không ném lỗi", () => {
    expect(parseFriendsTab(null)).toBe("friends");
    expect(parseFriendsTab("")).toBe("friends");
    expect(parseFriendsTab("admin")).toBe("friends");
  });

  it("có đúng 4 tab", () => {
    expect([...FRIENDS_TABS]).toEqual(["friends", "requests", "search", "blocked"]);
  });
});
