"use client";

import { useEffect } from "react";
import { appearanceStorage, applyTheme, DARK_SCHEME_QUERY } from "@/lib/appearance-storage";

/**
 * ThemeProvider — nối dây dark mode (H-01, UX-A-06).
 *
 * Áp class `.dark` lên `<html>` theo theme đã lưu khi mount. Không render gì, chỉ chạy
 * side-effect. Script chống nháy màn hình (FOUC) trong `layout.tsx` đã set class này TRƯỚC
 * khi React hydrate. Với "Hệ thống", phải nghe sự kiện `change` của matchMedia: người dùng
 * đổi sáng/tối trong hệ điều hành (hoặc OS tự đổi theo giờ) khi trang đang mở thì giao diện
 * đổi theo ngay, không cần tải lại. Theme đọc lại lúc sự kiện tới vì có thể vừa đổi trong Cài đặt.
 */
export function ThemeProvider(): null {
  useEffect(() => {
    applyTheme(appearanceStorage.getTheme());
    if (typeof window.matchMedia !== "function") return;

    const mq = window.matchMedia(DARK_SCHEME_QUERY);
    const onChange = () => {
      if (appearanceStorage.getTheme() === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return null;
}
