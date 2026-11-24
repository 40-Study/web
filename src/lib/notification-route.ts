/**
 * Đích điều hướng của các thông báo bạn bè/nhóm (plans/260930-groups-friends/contract-api.md §1).
 * Toast realtime (`use-notification-socket`) và trang /notifications dùng CHUNG hàm này để hai nơi
 * không lệch nhau. Loại thông báo khác (course/class/assignment) giữ cách xử lý cũ ở nơi gọi.
 */

import { resolveRoleAwareHref } from "@/lib/routes";

export interface NotificationTarget {
  notification_type: string;
  reference_type?: string | null;
  reference_id?: string | null;
}

/**
 * Trả `null` khi loại thông báo không thuộc nhóm bạn bè/nhóm hoặc thiếu dữ liệu để dựng đường dẫn.
 * `role` = vai đang dùng (đã chuẩn hoá, vd. "TEACHER"); chỉ cần cho các loại chung mà đích tuỳ vai.
 */
export function getNotificationHref(n: NotificationTarget, role?: string | null): string | null {
  if (n.notification_type === "lesson_reminder") {
    if (n.reference_type === "child_schedule") return n.reference_id ? `/parent/children/${n.reference_id}?tab=schedule` : null;
    if (n.reference_type === "teacher_schedule") return "/teacher/schedule";
    // Round 2: giảng viên đang dùng vai giảng viên bấm thông báo học viên -> /schedule bị guard đá lại; về lịch giảng dạy.
    if (n.reference_type === "student_schedule") return resolveRoleAwareHref("/schedule", role);
    if (n.reference_type === "livestream") return n.reference_id ? `/rooms/${n.reference_id}` : null;
  }
  // Admin duyệt/từ chối khoá (contract-be1 ADM-N1): notification_type "course_update" nhưng đích nằm ở
  // reference_type. /courses/<id> công khai không tồn tại với khoá chưa xuất bản/bị từ chối.
  if (n.reference_type === "course_review") {
    return n.reference_id ? `/teacher/courses/${n.reference_id}` : null;
  }
  // Q4-T12: thông báo của giảng viên ("Có học viên mới ghi danh", "Khoá học của bạn có đánh giá mới", "Doanh thu ...")
  // là loại chung (course_update + reference_type "course", payment_success) nên đích tuỳ vai đang dùng. Chỉ các
  // loại phía giảng viên: thông báo KHÔNG lọc theo vai, nên người nhiều vai đang dùng vai giảng viên vẫn nhận thông
  // báo học viên (new_lesson, quiz_reminder, certificate_earned...) cũng mang reference_type "course" của khoá họ HỌC.
  if (role === "TEACHER") {
    if (n.notification_type === "course_update" && n.reference_type === "course" && n.reference_id) {
      return `/teacher/courses/${n.reference_id}`;
    }
    if (n.notification_type === "payment_success") return "/teacher/wallet";
    // Q5-T10: "Nhắc chuẩn bị bài kiểm tra chương mới" gửi cho giảng viên cùng loại quiz_reminder với học viên;
    // vai giảng viên mở trang quản lý khoá, học viên vẫn không có đích (xử lý ở nơi gọi).
    if (n.notification_type === "quiz_reminder" && n.reference_type === "course" && n.reference_id) {
      return `/teacher/courses/${n.reference_id}`;
    }
  }
  switch (n.notification_type) {
    case "friend_request":
      return "/friends?tab=requests";
    case "friend_accepted":
      // reference_id = id người vừa chấp nhận (reference_type "user").
      return n.reference_id ? `/profile/${n.reference_id}` : null;
    case "group_added":
      // Payload chỉ có id nhóm, không có slug nên chỉ về danh sách nhóm (contract §1).
      return "/groups";
    default:
      return null;
  }
}

/** Loại thông báo làm thay đổi dữ liệu bạn bè (badge lời mời, danh sách bạn) cần làm mới cache. */
export function isFriendNotification(notificationType: string): boolean {
  return notificationType === "friend_request" || notificationType === "friend_accepted";
}
