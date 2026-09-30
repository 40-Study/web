/** Điều hướng thông báo bạn bè/nhóm theo bảng "Web điều hướng" của contract §1. */
import { describe, expect, it } from "vitest";
import { getNotificationHref, isFriendNotification } from "./notification-route";

describe("getNotificationHref", () => {
  it("friend_request -> /friends?tab=requests", () => {
    expect(getNotificationHref({ notification_type: "friend_request", reference_type: "friendship", reference_id: "f1" })).toBe(
      "/friends?tab=requests"
    );
  });

  it("friend_accepted -> hồ sơ người vừa chấp nhận (reference_id)", () => {
    expect(getNotificationHref({ notification_type: "friend_accepted", reference_type: "user", reference_id: "u9" })).toBe(
      "/profile/u9"
    );
  });

  it("friend_accepted thiếu reference_id: không dựng đường dẫn hỏng", () => {
    expect(getNotificationHref({ notification_type: "friend_accepted", reference_type: "user", reference_id: null })).toBeNull();
  });

  it("group_added -> /groups (payload không có slug)", () => {
    expect(getNotificationHref({ notification_type: "group_added", reference_type: "group", reference_id: "g1" })).toBe("/groups");
  });

  it("loại thông báo khác: null để nơi gọi giữ cách xử lý cũ", () => {
    for (const t of ["course_update", "achievement", "system"]) {
      expect(getNotificationHref({ notification_type: t, reference_type: "course", reference_id: "c1" })).toBeNull();
    }
  });
});

describe("isFriendNotification", () => {
  it("chỉ friend_request và friend_accepted làm đổi dữ liệu bạn bè", () => {
    expect(isFriendNotification("friend_request")).toBe(true);
    expect(isFriendNotification("friend_accepted")).toBe(true);
    expect(isFriendNotification("group_added")).toBe(false);
    expect(isFriendNotification("system")).toBe(false);
  });
});
