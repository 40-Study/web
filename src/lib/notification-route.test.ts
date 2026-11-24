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

  it("course_review (duyệt/từ chối khoá) -> trang quản lý khoá của giảng viên, KHÔNG phải /courses công khai", () => {
    expect(
      getNotificationHref({ notification_type: "course_update", reference_type: "course_review", reference_id: "c7" })
    ).toBe("/teacher/courses/c7");
  });

  it("course_review thiếu reference_id: không dựng đường dẫn hỏng", () => {
    expect(
      getNotificationHref({ notification_type: "course_update", reference_type: "course_review", reference_id: null })
    ).toBeNull();
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

it("nhắc học mở đúng lịch và không cho phụ huynh link vào phòng", () => {
 expect(getNotificationHref({ notification_type: "lesson_reminder", reference_type: "child_schedule", reference_id: "child-1" })).toBe("/parent/children/child-1?tab=schedule");
 expect(getNotificationHref({ notification_type: "lesson_reminder", reference_type: "teacher_schedule" })).toBe("/teacher/schedule");
 expect(getNotificationHref({ notification_type: "lesson_reminder", reference_type: "student_schedule" })).toBe("/schedule");
 expect(getNotificationHref({ notification_type: "lesson_reminder", reference_type: "livestream", reference_id: "session-1" })).toBe("/rooms/session-1");
});

describe("getNotificationHref — thông báo của giảng viên (Q4-T12)", () => {
  it("ghi danh mới / đánh giá mới (course_update + course) -> trang khoá của giảng viên", () => {
    expect(
      getNotificationHref({ notification_type: "course_update", reference_type: "course", reference_id: "c1" }, "TEACHER"),
    ).toBe("/teacher/courses/c1");
  });

  it("doanh thu (payment_success) -> ví giảng viên", () => {
    expect(getNotificationHref({ notification_type: "payment_success" }, "TEACHER")).toBe("/teacher/wallet");
  });

  it("người nhiều vai đang dùng vai giảng viên: thông báo phía học viên KHÔNG dẫn về trang khoá của giảng viên", () => {
    for (const type of ["new_lesson", "certificate_earned", "promotion"]) {
      expect(getNotificationHref({ notification_type: type, reference_type: "course", reference_id: "c9" }, "TEACHER")).not.toBe(
        "/teacher/courses/c9",
      );
    }
  });

  // Q5-T10: "Nhắc chuẩn bị bài kiểm tra chương mới" của giảng viên là quiz_reminder + course; trước đây không có đích.
  it("Q5-T10: quiz_reminder của giảng viên mở trang khoá của giảng viên; thiếu reference_id thì không dựng đường dẫn", () => {
    expect(
      getNotificationHref({ notification_type: "quiz_reminder", reference_type: "course", reference_id: "c3" }, "TEACHER"),
    ).toBe("/teacher/courses/c3");
    expect(getNotificationHref({ notification_type: "quiz_reminder", reference_type: "course", reference_id: null }, "TEACHER")).toBeNull();
    // Học viên vẫn không có đích cho cùng loại thông báo.
    expect(getNotificationHref({ notification_type: "quiz_reminder", reference_type: "course", reference_id: "c3" }, "STUDENT")).toBeNull();
  });

  it("vai khác giữ cách cũ", () => {
    expect(getNotificationHref({ notification_type: "payment_success" }, "STUDENT")).toBeNull();
    expect(getNotificationHref({ notification_type: "course_update", reference_type: "course", reference_id: "c1" })).toBeNull();
  });
});
