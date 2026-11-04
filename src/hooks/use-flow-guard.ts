"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Chặn bước giữa của một luồng nhiều bước (OTP đăng ký, đặt lại mật khẩu) khi mở thẳng URL (G-05, QA3 261104).
 * Trước đây trang vẫn hiện "gửi đến email của bạn" + đồng hồ đếm ngược dù chưa có yêu cầu nào, chỉ khi bấm
 * gửi mới bị đẩy đi. Thiếu bất kỳ khoá sessionStorage nào trong `requiredKeys` -> chuyển ngay tới `redirectTo`
 * kèm một dòng thông báo. sessionStorage chỉ có ở client nên trả `false` (không vẽ gì) cho tới khi kiểm xong.
 *
 * @returns true khi đủ điều kiện hiện trang.
 */
export function useFlowGuard(requiredKeys: readonly string[], redirectTo: string, message: string): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const keyList = requiredKeys.join("|");

  useEffect(() => {
    const complete = keyList.split("|").every((key) => Boolean(sessionStorage.getItem(key)));
    if (complete) {
      setReady(true);
      return;
    }
    toast.info(message);
    router.replace(redirectTo);
  }, [keyList, redirectTo, message, router]);

  return ready;
}
