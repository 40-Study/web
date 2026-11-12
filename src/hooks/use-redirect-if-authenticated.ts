"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { bootstrapAuthSession } from "@/components/providers/auth-session";
import { getRoleHomeRoute } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth.store";

type Phase = "idle" | "verifying" | "waiting" | "redirecting";

/**
 * A-01 (QA3 261104): người đã đăng nhập mở `/login` hoặc `/register` vẫn thấy form. Đưa họ về trang chủ
 * của vai trò đang dùng.
 *
 * Chỉ xét trạng thái phiên ĐẦU TIÊN đã xác định khi trang mở (bỏ qua "checking"). Nếu xét liên tục, lúc
 * đăng nhập thành công store chuyển sang "authenticated" và hook này sẽ chen ngang `router.push(redirect)`
 * của trang login (quay lại trang cũ qua `?redirect=`). Cố ý không làm ở middleware: nó chỉ thấy cookie,
 * không biết phiên còn sống hay vai trò gì; cookie cũ + RoleGuard đẩy về /login sẽ tạo vòng lặp chuyển hướng.
 *
 * UX-A-07: "authenticated" trong bộ nhớ có thể đã cũ. Cookie hết hạn/bị xoá giữa phiên thì middleware
 * đưa thẳng về /login mà app chưa gọi API nào, store vẫn báo đã đăng nhập; trước đây hook này đẩy tiếp
 * về /home, middleware lại đá về /login?redirect=/home (mất trang đang mở), màn hình trơn không form và
 * không có câu "phiên đã hết". Nay hỏi lại server trước: phiên hết thật thì bootstrap báo toast hết
 * phiên, xoá phiên và trang hiện form với `redirect` gốc.
 *
 * @returns true khi đang kiểm lại phiên hoặc đang chuyển hướng; trang nên không vẽ form.
 */
export function useRedirectIfAuthenticated(): boolean {
  const router = useRouter();
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const decided = useRef(false);
  const mounted = useRef(true);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const goHome = useCallback(() => {
    setPhase("redirecting");
    router.replace(getRoleHomeRoute(useAuthStore.getState().activeRole));
  }, [router]);

  useEffect(() => {
    if (decided.current || sessionStatus === "checking") return;
    decided.current = true;
    if (sessionStatus !== "authenticated") return;

    setPhase("verifying");
    // Không huỷ theo deps: chính lần kiểm này đổi sessionStatus (authenticated -> checking -> kết quả).
    void bootstrapAuthSession().then((status) => {
      if (!mounted.current) return;
      if (status === "authenticated") goHome();
      else if (status === "anonymous") setPhase("idle");
      // "checking" = máy chủ chưa trả lời: chờ kết luận của lượt thử lại sau (banner kết nối đang báo).
      else setPhase("waiting");
    });
  }, [sessionStatus, goHome]);

  useEffect(() => {
    if (phase !== "waiting") return;
    if (sessionStatus === "authenticated") goHome();
    else if (sessionStatus === "anonymous") setPhase("idle");
  }, [phase, sessionStatus, goHome]);

  return phase !== "idle";
}
