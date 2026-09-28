/**
 * Thông điệp tiếng Việt cho lỗi ở màn QUẢN LÝ cuộc thi.
 *
 * SSOT bảng mã là `contestErrorMessage` của W1 (`lib/contest/contest-errors.ts`). File này chỉ
 * GHI ĐÈ vài mã mà ở ngữ cảnh giảng viên/admin cần nói rõ cách sửa (câu chung của W1 viết cho
 * học viên), mọi mã khác uỷ quyền cho W1 để không có hai bảng dịch lệch nhau.
 */

import { contestErrorMessage as baseContestErrorMessage } from "@/lib/contest/contest-errors";
import { ApiError } from "@/lib/errors";
import type { ContestErrorCode } from "@/types/contest";

export const MANAGE_ERROR_OVERRIDES: Partial<Record<ContestErrorCode, string>> = {
  CONTEST_INVALID_SCHEDULE:
    "Lịch chưa hợp lệ: giờ bắt đầu phải ở tương lai và giờ kết thúc phải sau giờ bắt đầu cộng thời lượng làm bài.",
  CONTEST_QUIZ_INVALID:
    "Bài trắc nghiệm chưa đủ điều kiện: cần ít nhất 1 câu, không có câu tự luận, chưa ai làm và không gắn với bài học/khoá học.",
  CONTEST_PRIZES_INVALID:
    "Cơ cấu giải chưa hợp lệ: hạng từ 1 đến 100, các khoảng hạng không chồng nhau, tối đa 10 giải và mỗi giải phải có chứng nhận hoặc voucher.",
  CONTEST_NOT_FOUND: "Không tìm thấy cuộc thi (có thể đã bị xoá hoặc bạn không phải người tạo).",
  CONTEST_START_PASSED: "Đã qua giờ bắt đầu cuộc thi. Hãy sửa lại lịch trước khi gửi duyệt hoặc duyệt.",
  CONTEST_NOT_ENDED: "Chỉ có thể chốt kết quả sau khi cuộc thi kết thúc ít nhất 60 giây.",
  CONTEST_VOUCHER_UNAVAILABLE:
    "Voucher của giải không còn dùng được (đã tắt, bị xoá hoặc hết hạn). Hãy chọn voucher khác.",
};

export function contestErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const override = (MANAGE_ERROR_OVERRIDES as Record<string, string | undefined>)[error.code];
    if (override) return override;
  }
  return baseContestErrorMessage(error, fallback);
}
