/**
 * QA7-A06: `?page=9999` vượt trang cuối cho danh sách rỗng, và vì trạng thái rỗng thay chỗ thanh phân trang nên
 * admin không còn đường quay lại ngoài việc sửa URL. Khi server báo số trang thật (>= 1) mà trang đang xin lớn
 * hơn thì kéo về trang cuối. Trả `null` khi không cần kéo (kể cả khi không có kết quả nào: total_pages = 0).
 */
export function lastPageToClampTo(page: number, totalPages: number | undefined): number | null {
  if (totalPages === undefined || !Number.isFinite(totalPages) || totalPages < 1) return null;
  return page > totalPages ? Math.floor(totalPages) : null;
}
