/**
 * /teacher — QA 261008 T12: trước đây 404 vì không có trang gốc. Đăng nhập xong giảng viên đã được
 * đưa tới trang chủ vai trò (/teacher/schedule), nên gốc cũng chuyển thẳng tới đó (bookmark /teacher,
 * gõ tay URL...). Redirect phía server: không nhấp nháy giao diện. Đích lấy từ ROLE_HOME_ROUTES để
 * không lệch với đích sau đăng nhập.
 */

import { redirect } from "next/navigation";
import { ROLE_HOME_ROUTES } from "@/lib/routes";

export default function TeacherIndexPage() {
  redirect(ROLE_HOME_ROUTES.TEACHER);
}
