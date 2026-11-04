"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleHomeRoute } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth.store";

/**
 * A-01 (QA3 261104): người đã đăng nhập mở `/login` hoặc `/register` vẫn thấy form. Đưa họ về trang chủ
 * của vai trò đang dùng.
 *
 * Chỉ xét trạng thái phiên ĐẦU TIÊN đã xác định khi trang mở (bỏ qua "checking"). Nếu xét liên tục, lúc
 * đăng nhập thành công store chuyển sang "authenticated" và hook này sẽ chen ngang `router.push(redirect)`
 * của trang login (quay lại trang cũ qua `?redirect=`). Cố ý không làm ở middleware: nó chỉ thấy cookie,
 * không biết phiên còn sống hay vai trò gì; cookie cũ + RoleGuard đẩy về /login sẽ tạo vòng lặp chuyển hướng.
 *
 * @returns true khi đang chuyển hướng; trang nên không vẽ form.
 */
export function useRedirectIfAuthenticated(): boolean {
  const router = useRouter();
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const activeRole = useAuthStore((s) => s.activeRole);
  const decided = useRef(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (decided.current || sessionStatus === "checking") return;
    decided.current = true;
    if (sessionStatus === "authenticated") {
      setRedirecting(true);
      router.replace(getRoleHomeRoute(activeRole));
    }
  }, [sessionStatus, activeRole, router]);

  return redirecting;
}
