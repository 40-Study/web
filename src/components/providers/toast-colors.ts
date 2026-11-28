import type { CSSProperties } from "react";

/**
 * Q11-STU-03: bảng màu rich-colors mặc định của Sonner (chữ sắc 45% trên nền sắc 96-97%) chỉ đạt 4.29 (success), 4.35 (info),
 * 3.07 (warning) và 4.36 (error) :1, dưới ngưỡng AA 4.5:1 cho chữ 13 px. Tiêu đề, mô tả và nút đóng của toast đều kế thừa
 * `--<kind>-text`, nên chỉ cần đổi 4 biến chữ này (nền/viền giữ nguyên của Sonner). Giá trị Tailwind sắc 700-800, đạt
 * 5.8-6.9:1 trên nền Sonner (test `toast-colors.test.ts` đo từng loại trên chính `styles.css` của Sonner).
 */
export const TOAST_TEXT_COLORS = {
  success: "#166534",
  info: "#1d4ed8",
  warning: "#92400e",
  error: "#b91c1c",
} as const;

export type ToastKind = keyof typeof TOAST_TEXT_COLORS;

/** Style inline cho `<Toaster>`: thắng selector theme của Sonner vì cùng nằm trên phần tử `ol[data-sonner-toaster]`. */
export const TOAST_STYLE = Object.fromEntries(
  Object.entries(TOAST_TEXT_COLORS).map(([kind, color]) => [`--${kind}-text`, color])
) as CSSProperties;
