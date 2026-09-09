"use client";

import { useEffect } from "react";
import { appearanceStorage, applyTheme } from "@/lib/appearance-storage";

/**
 * ThemeProvider — nối dây dark mode (H-01).
 *
 * Áp class `.dark` lên `<html>` theo theme đã lưu (light/dark/system) khi mount,
 * và lắng nghe thay đổi `prefers-color-scheme` của hệ điều hành khi đang ở "system".
 * Không render gì — chỉ chạy side-effect. Script chống nháy màn hình (FOUC) đặt
 * trong `layout.tsx` đã set class này TRƯỚC khi React hydrate; effect ở đây giữ nó
 * đồng bộ trong suốt vòng đời trang (đổi theme trong Settings, đổi theme hệ điều hành).
 */
export function ThemeProvider(): null {
  useEffect(() => {
    const theme = appearanceStorage.getTheme();
    applyTheme(theme);

    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return null;
}
