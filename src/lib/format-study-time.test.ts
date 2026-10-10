import { describe, it, expect } from "vitest";
import { formatStudyTime, formatStudyMinutes } from "./format-study-time";

describe("formatStudyTime", () => {
  it("chưa xem giây nào thì hiển thị 0m", () => {
    expect(formatStudyTime(0)).toBe("0m");
  });

  it("có xem nhưng chưa đủ 1 phút thì KHÔNG được hiển thị 0m", () => {
    // Người học xem 40 giây mà thấy "0m" sẽ tưởng hệ thống không ghi nhận gì.
    expect(formatStudyTime(1)).toBe("<1m");
    expect(formatStudyTime(40)).toBe("<1m");
    expect(formatStudyTime(59)).toBe("<1m");
  });

  it("dưới 1 giờ thì hiển thị theo phút", () => {
    expect(formatStudyTime(60)).toBe("1m");
    expect(formatStudyTime(599)).toBe("9m");
    expect(formatStudyTime(3599)).toBe("59m");
  });

  it("tròn giờ thì không kèm 0m thừa", () => {
    expect(formatStudyTime(3600)).toBe("1h");
    expect(formatStudyTime(7200)).toBe("2h");
  });

  it("giờ lẻ phút thì hiển thị cả hai", () => {
    expect(formatStudyTime(3660)).toBe("1h 1m");
    expect(formatStudyTime(6300)).toBe("1h 45m");
    // Giá trị thật đo được trên DB dev của student1@demo.com.
    expect(formatStudyTime(10200)).toBe("2h 50m");
  });

  it("bỏ phần giây lẻ, không làm tròn lên", () => {
    // 3659 giây là 1h 59s — chưa đủ phút thứ nhất, phải là "1h" chứ không phải "1h 1m".
    expect(formatStudyTime(3659)).toBe("1h");
    expect(formatStudyTime(119)).toBe("1m");
  });

  it("số âm quy về 0m thay vì in ra thời gian âm", () => {
    // Backend đã chặn ở tầng validate; đây là lớp phòng thủ thứ hai ở phía hiển thị.
    expect(formatStudyTime(-1)).toBe("0m");
    expect(formatStudyTime(-999999)).toBe("0m");
  });

  it("đầu vào rác không làm vỡ giao diện", () => {
    expect(formatStudyTime(NaN)).toBe("0m");
    expect(formatStudyTime(Infinity)).toBe("0m");
    expect(formatStudyTime(-Infinity)).toBe("0m");
    expect(formatStudyTime(undefined)).toBe("0m");
    expect(formatStudyTime(null)).toBe("0m");
  });

  it("số rất lớn vẫn cho chuỗi hợp lệ", () => {
    // 1000 giờ học — không được rơi vào ký hiệu khoa học hay chuỗi rỗng.
    expect(formatStudyTime(3600 * 1000)).toBe("1000h");
    expect(formatStudyTime(3600 * 1000 + 1800)).toBe("1000h 30m");
  });

  it("giây thập phân được cắt xuống", () => {
    expect(formatStudyTime(90.9)).toBe("1m");
    expect(formatStudyTime(0.5)).toBe("<1m");
  });
});

describe("formatStudyMinutes (thời gian học của con, phụ huynh)", () => {
  it("gộp giờ + phút, không làm tròn thành giờ", () => {
    // P5: /home từng hiện "2 giờ 50 phút" còn trang con làm tròn "3h" — phải cùng một kết quả.
    expect(formatStudyMinutes(170)).toBe("2 giờ 50 phút");
  });

  it("tròn giờ thì không kèm 0 phút", () => {
    expect(formatStudyMinutes(180)).toBe("3 giờ");
  });

  it("dưới 1 giờ chỉ hiện phút", () => {
    expect(formatStudyMinutes(45)).toBe("45 phút");
  });

  it("không có dữ liệu thì 0 phút", () => {
    expect(formatStudyMinutes(0)).toBe("0 phút");
  });

  it("đầu vào rác quy về 0 phút", () => {
    expect(formatStudyMinutes(-5)).toBe("0 phút");
    expect(formatStudyMinutes(NaN)).toBe("0 phút");
    expect(formatStudyMinutes(Infinity)).toBe("0 phút");
    expect(formatStudyMinutes(undefined)).toBe("0 phút");
    expect(formatStudyMinutes(null)).toBe("0 phút");
  });
});
