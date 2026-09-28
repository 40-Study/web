/**
 * QA vòng 2 (G1): một mốc giờ đã biết phải hiển thị đúng giờ Việt Nam dù máy chạy ở múi giờ nào.
 * Ép TZ=UTC (giống CI) — nếu helper bỏ `timeZone: "Asia/Ho_Chi_Minh"` thì 10:00 VN hiện thành 03:00.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { formatVnDateTime } from "./format-vn-datetime";

const originalTz = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "UTC";
});

afterAll(() => {
  process.env.TZ = originalTz;
});

describe("formatVnDateTime", () => {
  it("chuỗi backend mới (+07:00) hiện đúng 10:00 giờ VN", () => {
    expect(formatVnDateTime("2026-09-28T10:00:00+07:00")).toBe("10:00 28/09/2026");
  });

  it("cùng instant viết theo UTC (03:00Z) cũng ra 10:00 giờ VN", () => {
    expect(formatVnDateTime("2026-09-28T03:00:00Z")).toBe("10:00 28/09/2026");
  });

  it("chuỗi kiểu CŨ (giờ local gắn Z) là sai 7 tiếng — lý do backend phải đổi format", () => {
    // 10:00 VN bị backend cũ in thành "…T10:00:00Z" => web hiểu là 17:00 VN.
    expect(formatVnDateTime("2026-09-28T10:00:00Z")).toBe("17:00 28/09/2026");
  });

  it("null/rỗng/không hợp lệ hiện gạch ngang", () => {
    expect(formatVnDateTime(null)).toBe("—");
    expect(formatVnDateTime("")).toBe("—");
    expect(formatVnDateTime("khong-phai-ngay")).toBe("—");
  });
});
