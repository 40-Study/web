import { notFound } from "next/navigation";

/**
 * Q7-T09: đường dẫn `/teacher/...` không khớp trang nào. Next chỉ dựng `not-found.tsx` của nhóm `(teacher)` (trong khung
 * giảng viên) khi `notFound()` được gọi từ một trang nằm trong nhóm; URL không khớp route nào thì rơi ra 404 toàn cục.
 * Route bắt-tất-cả này có độ ưu tiên thấp nhất nên không che trang thật nào.
 */
export default function TeacherUnknownRoutePage(): never {
  notFound();
}
