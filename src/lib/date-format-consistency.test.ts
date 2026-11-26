/**
 * QA7 T08 / S7-07: mỗi trang từng tự dựng một thứ tự ngày/giờ ("13:08 24/11/2026" ở danh sách cuộc thi, "24/11/2026 13:08" ở
 * bài tập, "6/10/2026" thiếu số 0 ở diễn đàn). Mọi formatter ngày giờ của app giờ phải cho CÙNG MỘT chuỗi.
 */
import { describe, expect, it } from "vitest";
import { formatDateTime } from "@/components/grading/submission-grade-dialog";
import { formatSubmittedAt } from "@/components/teacher/exercise-submission-format";
import { formatContestDateTime, formatContestTimeWithSeconds } from "@/lib/contest/contest-format";
import { formatVnDateTime as formatContestManage } from "@/lib/contest-manage/format";
import { formatDate } from "@/lib/utils";
import { formatOrderDateTime } from "@/services/order.service";

const ISO = "2026-11-24T06:08:05Z"; // 13:08:05 giờ VN

describe("một định dạng ngày giờ duy nhất (dd/MM/yyyy HH:mm)", () => {
  it.each([
    ["formatContestManage (danh sách cuộc thi giảng viên)", formatContestManage(ISO)],
    ["formatDateTime (bài tập lớp)", formatDateTime(ISO)],
    ["formatSubmittedAt (bài nộp)", formatSubmittedAt(ISO)],
    ["formatContestDateTime (cuộc thi học viên)", formatContestDateTime(ISO)],
    ["formatOrderDateTime (đơn hàng)", formatOrderDateTime(ISO)],
  ])("%s", (_name, text) => {
    expect(text).toBe("24/11/2026 13:08");
  });

  it("mốc có giây cũng ngày trước giờ sau", () => {
    expect(formatContestTimeWithSeconds(ISO)).toBe("24/11/2026 13:08:05");
  });

  it("ngày thuần đệm số 0", () => {
    expect(formatDate("2026-10-06T10:00:00+07:00")).toBe("06/10/2026");
  });
});
