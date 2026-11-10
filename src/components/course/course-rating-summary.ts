/**
 * Số liệu đánh giá cho trang chi tiết khoá học (QA-A-02, 10/11/2026).
 *
 * Trước đây trang truyền 0 khi `GET /courses/:id/reviews` chưa trả về, nên lúc đang tải (và khi request lỗi
 * hay quá hạn trên mạng chậm) header hiện "0.0 (0 đánh giá)" và khối đánh giá hiện "Chưa có đánh giá nào",
 * mâu thuẫn với thẻ ở danh mục ("5.0 (1)"). Ba trạng thái phải tách bạch:
 * - đang tải: chưa được nói gì về số đánh giá (hiện khung chờ);
 * - có dữ liệu reviews: đó là nguồn đúng;
 * - lỗi: dùng cột lưu sẵn trên khoá học (cùng nguồn với thẻ danh mục) thay vì bịa ra số 0.
 */

export type CourseRatingSummary =
  | { status: "loading" }
  | { status: "ready"; average: number; total: number };

interface ReviewsSnapshot {
  average_rating?: number | string | null;
  total: number;
}

export function resolveCourseRatingSummary({
  reviews,
  isError,
  fallback,
}: {
  reviews: ReviewsSnapshot | undefined;
  isError: boolean;
  fallback: { rating?: number | null; reviewCount?: number | null };
}): CourseRatingSummary {
  if (reviews) {
    return { status: "ready", average: Number(reviews.average_rating ?? 0), total: reviews.total ?? 0 };
  }
  if (isError) {
    return { status: "ready", average: Number(fallback.rating ?? 0), total: fallback.reviewCount ?? 0 };
  }
  return { status: "loading" };
}
