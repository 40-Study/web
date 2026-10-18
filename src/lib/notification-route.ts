/**
 * Đích điều hướng của các thông báo bạn bè/nhóm (plans/260930-groups-friends/contract-api.md §1).
 * Toast realtime (`use-notification-socket`) và trang /notifications dùng CHUNG hàm này để hai nơi
 * không lệch nhau. Loại thông báo khác (course/class/assignment) giữ cách xử lý cũ ở nơi gọi.
 */

export interface NotificationTarget {
  notification_type: string;
  reference_type?: string | null;
  reference_id?: string | null;
}

/** Trả `null` khi loại thông báo không thuộc nhóm bạn bè/nhóm hoặc thiếu dữ liệu để dựng đường dẫn. */
export function getNotificationHref(n: NotificationTarget): string | null {
  if (n.notification_type === "lesson_reminder") {
    if (n.reference_type === "child_schedule") return n.reference_id ? `/parent/children/${n.reference_id}?tab=schedule` : null;
    if (n.reference_type === "teacher_schedule") return "/teacher/schedule";
    if (n.reference_type === "student_schedule") return "/schedule";
    if (n.reference_type === "livestream") return n.reference_id ? `/rooms/${n.reference_id}` : null;
  }
  // Admin duyệt/từ chối khoá (contract-be1 ADM-N1): notification_type "course_update" nhưng đích nằm ở
  // reference_type. /courses/<id> công khai không tồn tại với khoá chưa xuất bản/bị từ chối.
  if (n.reference_type === "course_review") {
    return n.reference_id ? `/teacher/courses/${n.reference_id}` : null;
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
