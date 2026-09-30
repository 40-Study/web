/** Lời chào theo giờ trong ngày: sáng < 12h, chiều < 18h, còn lại là tối. */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Ngày đầy đủ kiểu Việt Nam, ví dụ "Thứ Tư, 30 tháng 9, 2026". */
export function formatToday(date: Date = new Date()): string {
  const text = date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}
