/**
 * E3 (QA vòng 2): `enrolled_courses` của API overview là TỔNG số khoá đã ghi danh (gồm cả khoá đã
 * hoàn thành). Gán thẳng vào nhãn "Đang học" khiến "3 Đang học · 1 Hoàn thành" cộng ra 4 khoá
 * trong khi con chỉ có 3. Số đang học = tổng - đã hoàn thành (không âm nếu dữ liệu lệch).
 */
export function inProgressCourseCount(overview: { enrolled_courses: number; completed_courses: number }): number {
  return Math.max(0, overview.enrolled_courses - overview.completed_courses);
}
