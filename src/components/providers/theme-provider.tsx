"use client";

import { useEffect } from "react";
import { appearanceStorage, applyFontSize, applyTheme } from "@/lib/appearance-storage";

/**
 * ThemeProvider — nối dây dark mode (H-01) và cỡ chữ (QA6 S6-04).
 *
 * Áp class `.dark` lên `<html>` theo theme đã lưu khi mount. Không render gì — chỉ chạy
 * side-effect. Script chống nháy màn hình (FOUC) trong `layout.tsx` đã set class này TRƯỚC
 * khi React hydrate; effect ở đây giữ đồng bộ khi đổi theme trong Settings. "system" chưa
 * theo prefers-color-scheme của OS (xem applyTheme) nên không cần lắng nghe matchMedia.
 */
export function ThemeProvider(): null {
  useEffect(() => {
    applyTheme(appearanceStorage.getTheme());
    applyFontSize(appearanceStorage.getFontSize());
  }, []);

  return null;
}
