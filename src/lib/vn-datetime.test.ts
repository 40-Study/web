import { describe, expect, it, vi } from "vitest";
import { courseLevelLabel } from "./course-level";
import { formatVnDate, formatVnDateOnly, formatVnDateTime, formatVnDateThenTime, hasVnSessionEnded, isVnSessionUpcoming } from "./vn-datetime";

describe("courseLevelLabel", () => {
  it("dịch mã trình độ sang tiếng Việt", () => {
    expect(courseLevelLabel("beginner")).toBe("Cơ bản");
    expect(courseLevelLabel("intermediate")).toBe("Trung cấp");
    expect(courseLevelLabel("advanced")).toBe("Nâng cao");
    expect(courseLevelLabel("all_levels")).toBe("Mọi trình độ");
  });
  it("rỗng thì —, mã lạ giữ nguyên", () => {
    expect(courseLevelLabel("")).toBe("—");
    expect(courseLevelLabel(undefined)).toBe("—");
    expect(courseLevelLabel("expert")).toBe("expert");
  });
});

describe("formatVnDateOnly", () => {
  it("đổi YYYY-MM-DD sang DD/MM/YYYY không qua múi giờ", () => {
    expect(formatVnDateOnly("2026-10-03")).toBe("03/10/2026");
  });
  it("rỗng thì —", () => {
    expect(formatVnDateOnly(null)).toBe("—");
  });
});

describe("formatVnDateTime", () => {
  it("không in chuỗi ISO thô và luôn theo giờ Việt Nam", () => {
    const text = formatVnDateTime("2026-09-28T18:00:09+07:00");
    expect(text).not.toContain("T18");
    expect(text).toBe("28/09/2026 18:00");
  });
  // QA7 (T08/S7-07): MỘT thứ tự duy nhất, ngày trước giờ sau, đệm số 0.
  it("ngày trước, giờ sau, đệm số 0 (dd/MM/yyyy HH:mm)", () => {
    expect(formatVnDateTime("2026-10-06T03:05:00+07:00")).toBe("06/10/2026 03:05");
    expect(formatVnDateTime("2026-09-28T03:00:00Z")).toBe("28/09/2026 10:00");
  });
  it("nửa đêm là 00:xx, không phải 24:xx", () => {
    expect(formatVnDateTime("2026-10-06T00:05:00+07:00")).toBe("06/10/2026 00:05");
  });
  it("nhận cả Date và tuỳ chọn giây", () => {
    expect(formatVnDateTime(new Date("2026-09-28T03:00:30Z"))).toBe("28/09/2026 10:00");
    expect(formatVnDateTime("2026-09-28T03:00:30Z", { seconds: true })).toBe("28/09/2026 10:00:30");
  });
  it("chuỗi hỏng thì —", () => {
    expect(formatVnDateTime("khong-phai-ngay")).toBe("—");
  });
});
describe("formatVnDate (QA7 S7-07)", () => {
  it("đệm số 0 như các trang khác, không phải '6/10/2026'", () => {
    expect(formatVnDate("2026-10-06T10:00:00+07:00")).toBe("06/10/2026");
    expect(formatVnDate(new Date("2026-10-05T17:30:00Z"))).toBe("06/10/2026"); // qua nửa đêm giờ VN
  });
  it("YYYY-MM-DD thuần không lệch ngày", () => {
    expect(formatVnDate("2026-10-03")).toBe("03/10/2026");
  });
  it("rỗng/hỏng thì —", () => {
    expect(formatVnDate(null)).toBe("—");
    expect(formatVnDate("khong-phai-ngay")).toBe("—");
  });
});

describe("formatVnDateThenTime", () => {
  it("ngày trước, giờ sau (dd/MM/yyyy HH:mm) theo giờ Việt Nam", () => {
    expect(formatVnDateThenTime("2026-10-07T19:00:00+07:00")).toBe("07/10/2026 19:00");
  });
  it("đổi múi giờ sang giờ Việt Nam, kể cả khi qua nửa đêm", () => {
    expect(formatVnDateThenTime("2026-10-07T17:30:00Z")).toBe("08/10/2026 00:30");
  });
  it("rỗng/chuỗi hỏng thì — (không hiện Invalid Date)", () => {
    expect(formatVnDateThenTime(null)).toBe("—");
    expect(formatVnDateThenTime("khong-phai-ngay")).toBe("—");
  });
});


describe("formatter dùng chung (F-11 review)", () => {
  it("không dựng Intl.DateTimeFormat mới cho mỗi lần gọi (mỗi dòng bảng điểm danh)", () => {
    const spy = vi.spyOn(Intl, "DateTimeFormat");
    try {
      formatVnDateThenTime("2026-10-07T19:00:00+07:00");
      formatVnDateThenTime("2026-10-08T19:00:00+07:00");
      formatVnDateTime("2026-10-09T19:00:00+07:00");
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe("isVnSessionUpcoming (Q5-T02, M1)", () => {
  // 12:00 giờ VN = 05:00 UTC; máy chạy test ở múi giờ nào cũng phải ra cùng kết quả.
  const now = new Date("2026-11-24T05:00:00Z");

  it("buổi bắt đầu sau bây giờ (giờ VN) là sắp tới", () => {
    expect(isVnSessionUpcoming("2026-11-24", "18:00", now)).toBe(true);
    expect(isVnSessionUpcoming("2026-11-24", "12:01", now)).toBe(true);
    expect(isVnSessionUpcoming("2026-11-25", "00:00:00", now)).toBe(true);
  });

  it("buổi đã bắt đầu (kể cả hôm nay) hoặc bắt đầu đúng lúc này không còn là sắp tới", () => {
    expect(isVnSessionUpcoming("2026-11-24", "08:00", now)).toBe(false);
    expect(isVnSessionUpcoming("2026-11-24", "12:00", now)).toBe(false);
    expect(isVnSessionUpcoming("2026-11-02", "18:00", now)).toBe(false);
  });

  it("date dạng RFC3339 nửa đêm vẫn lấy theo NGÀY, không theo giờ của chuỗi đó", () => {
    expect(isVnSessionUpcoming("2026-11-24T00:00:00Z", "18:00:00", now)).toBe(true);
    expect(isVnSessionUpcoming("2026-11-24T00:00:00Z", "09:00:00", now)).toBe(false);
  });

  it("thiếu hoặc sai định dạng thì false (không chứng minh được buổi còn ở tương lai)", () => {
    expect(isVnSessionUpcoming(undefined, "18:00", now)).toBe(false);
    expect(isVnSessionUpcoming("2026-11-24", null, now)).toBe(false);
    expect(isVnSessionUpcoming("24/11/2026", "18:00", now)).toBe(false);
    expect(isVnSessionUpcoming("2026-11-24", "6pm", now)).toBe(false);
    expect(isVnSessionUpcoming("2026-13-45", "18:00", now)).toBe(false);
  });
});

describe("hasVnSessionEnded (Q6-T04)", () => {
  // 12:00 giờ VN = 05:00 UTC.
  const now = new Date("2026-11-24T05:00:00Z");

  it("buổi có giờ kết thúc trước hoặc đúng lúc này (giờ VN) là đã kết thúc", () => {
    expect(hasVnSessionEnded("2026-11-24", "11:59", now)).toBe(true);
    expect(hasVnSessionEnded("2026-11-24", "12:00", now)).toBe(true);
    expect(hasVnSessionEnded("2026-11-23", "23:59:00", now)).toBe(true);
    expect(hasVnSessionEnded("2026-11-24T00:00:00Z", "10:00:00", now)).toBe(true);
  });

  it("buổi chưa tới giờ kết thúc (đang diễn ra hoặc ở tương lai) chưa kết thúc", () => {
    expect(hasVnSessionEnded("2026-11-24", "12:01", now)).toBe(false);
    expect(hasVnSessionEnded("2026-11-25", "08:00", now)).toBe(false);
  });

  // #134 L-2: `end <= start` biến buổi 10:00-10:00 (dữ liệu xấu) thành buổi 24 giờ "đang diễn ra" cả ngày.
  it("giờ kết thúc BẰNG giờ bắt đầu: kết thúc ngay lúc bắt đầu, không kéo dài 24 giờ", () => {
    expect(hasVnSessionEnded("2026-11-24", "10:00", now, "10:00")).toBe(true); // 12:00, đã qua 10:00
    expect(hasVnSessionEnded("2026-11-24", "14:00", now, "14:00")).toBe(false); // chưa tới 14:00
  });

  it("buổi qua nửa đêm (kết thúc < bắt đầu) vẫn kết thúc vào ngày hôm sau", () => {
    expect(hasVnSessionEnded("2026-11-24", "01:00", now, "23:00")).toBe(false); // 12:00 ngày 24: chưa tới 01:00 ngày 25
    expect(hasVnSessionEnded("2026-11-23", "01:00", now, "23:00")).toBe(true);
  });

  it("thiếu hoặc sai định dạng thì false", () => {
    expect(hasVnSessionEnded(undefined, "10:00", now)).toBe(false);
    expect(hasVnSessionEnded("2026-11-24", "", now)).toBe(false);
    expect(hasVnSessionEnded("2026-13-45", "10:00", now)).toBe(false);
  });
});
