/**
 * Lời trống của danh sách cuộc thi (QA4-A06). Có từ khoá mà không khớp thì phải nói "không khớp từ khoá",
 * không phải "không có cuộc thi nào chờ duyệt" (đọc như hàng chờ đang trống).
 */
export function contestListEmptyCopy(tab: "pending" | "all", keyword: string): { title: string; description: string } {
  const q = keyword.trim();
  if (q) return { title: `Không có cuộc thi khớp “${q}”`, description: "Thử từ khoá khác hoặc xoá ô tìm kiếm." };
  return {
    title: "Không có cuộc thi nào",
    description: tab === "pending" ? "Hiện không có cuộc thi nào chờ duyệt." : "Không có cuộc thi khớp bộ lọc hiện tại.",
  };
}
