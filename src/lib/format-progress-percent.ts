/**
 * Tiến độ khoá học hiển thị dạng số nguyên phần trăm (QA4 S12): backend trả
 * `progress_percentage` thập phân ("55.56"), /home đã làm tròn thành 56% nên
 * /my-courses cũng phải làm tròn. Chỉ làm tròn khi HIỂN THỊ: giá trị gốc vẫn
 * dùng để lọc khoá "đang học" (< 100), làm tròn sớm sẽ biến 99.6% thành xong.
 */
export function formatProgressPercent(value: number | null | undefined): string {
  const n = Number.isFinite(value) ? (value as number) : 0;
  return `${Math.min(100, Math.max(0, Math.round(n)))}%`;
}
