"use client";

/**
 * Bước "chọn vai trò" trước đây không nối vào luồng đăng ký nào cả (dead
 * code — không nơi nào redirect tới đây, C-x trong plans/reports/
 * code-reviewer-260909-1340-web-logic-integration.md).
 *
 * Sau khi đối chiếu backend (internal/service/auth_service.go#Register —
 * comment "Không gán role ở đây — role được tạo khi user gọi SelectRole
 * lần đầu"), việc chọn vai trò KHÔNG diễn ra lúc đăng ký: `POST
 * /auth/register` chỉ tạo user, không nhận field role nào cả.
 * `POST /auth/select-role` cũng không phải API "trở thành STUDENT/PARENT"
 * — nó chọn một `role_id` có sẵn trong `session_token` của LUỒNG ĐĂNG NHẬP
 * (system_roles trả về từ GET /auth/system-roles), và role tự-phục-vụ
 * (STUDENT/PARENT) chỉ được tạo ở lần đăng nhập đầu tiên, ở trang
 * /login/role (đã hoạt động đúng — không đụng tới).
 *
 * Vì vậy trang này không có việc gì để làm trước khi đăng ký; chuyển
 * thẳng sang bước điền form để không còn là dead-end.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/routes";

export default function RegisterRolePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(AUTH_ROUTES.REGISTER_FORM);
  }, [router]);

  return null;
}
