"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Trang kết thúc một luồng (đăng ký / đặt lại mật khẩu thành công) chỉ hiện khi bước trước vừa đặt cờ
 * (N-11, QA4 261123: mở thẳng URL vẫn thấy "Bạn đã tạo tài khoản thành công!"). Cờ ở sessionStorage, dùng một
 * lần: trang đọc rồi xoá, tải lại hoặc mở lại URL sau đó thì về `redirectTo`.
 */
export function markOneShotPage(flagKey: string): void {
  sessionStorage.setItem(flagKey, "1");
}

/** @returns true khi trang được phép hiện (có cờ). Chưa kiểm xong hoặc không có cờ: false và chuyển trang. */
export function useOneShotPage(flagKey: string, redirectTo: string): boolean {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(flagKey)) {
      router.replace(redirectTo);
      return;
    }
    setAllowed(true);
    // Xoá ở lượt sau, huỷ khi effect bị dọn: StrictMode (dev) chạy effect hai lần, xoá ngay thì lượt thứ hai
    // không thấy cờ và đẩy người dùng vừa đăng ký xong sang /login.
    const timer = setTimeout(() => sessionStorage.removeItem(flagKey), 0);
    return () => clearTimeout(timer);
  }, [flagKey, redirectTo, router]);

  return allowed;
}
